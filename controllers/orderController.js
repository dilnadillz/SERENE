const mongoose = require('mongoose')

const productModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const cartModel = require('../models/cartModel');
const addressModel = require('../models/addressModel');
const orderModel = require('../models/orderModel');



const orderPlace = async(req,res,next) => {
    try{
        
        const userId = res.locals.user;
        const {productId} = req.body;
        const {selectedAddress,paymentMethod} = req.body;
        // console.log("owwowowowoww",selectedAddress,paymentMethod)
        // retrving the list of products that the user has added to their shopping cart
        const cart = await cartModel.findOne({userId:userId,productId:productId}).populate('products.productId');
        if(!cart){
            return res.status(404).json({ message: "Cart not found" });
        }
        console.log("cart",cart)
        const totalAmount = cart.products.reduce((total,product)=>{
            return total+=(product.quantity*product.productId.price)
          },0)

        // console.log("totalAmount",totalAmount)

        const order = new orderModel ({
            userId:userId,
            delivery_address:selectedAddress,
            total_amount:totalAmount,
            date:new Date(),
            payment:paymentMethod,
            details: cart.products.map(item => ({
                productId:item.productId,
                quantity:item.quantity,
                price:item.productId.price,
                status:'Pending'
            }))
                
        })
        // console.log("order",order)
        await order.save();

        await cartModel.findOneAndDelete({userId:userId});

        res.status(200).json({ order, message: 'order updated successfully.' });
    }catch(error){
        next(error);
    }
}



const loadOrder = async (req, res,next) => {
    try {
        const userId = res.locals.user
        const orderData = await orderModel.find({userId:userId});
        console.log(orderData)
        res.render('orders',{orderData:orderData});
    } catch (error) {
        next(error);
    }
}       

const orderCancel = async(req,res,next) => {
    try{
          
        const {orderId} = req.body;
       const { productId } = req.body;
        
    
        const order = await orderModel.findOne({_id:orderId});
        if(!order){
            res.status(404).json({message:'order not found'});
        }



        const productIndex = order.details.findIndex((item)=>item.productId==productId);
        console.log("working",productIndex)
        
        if(productIndex===-1){
            res.status(404).json({order,message:'product not found in the cart'});
        }
        order.details[productIndex].status = 'Cancelled';  
        await order.save();
      
      

        return res.status(200).json({ message: 'Product cancelled successfully' });
    }catch(error){
        next(error);
    }
}

const viewOrder = async(req,res,next) => {
    try{
        const userId = res.locals.user; 
        const{ orderId,productId} = req.query;
       
        // console.log("ordeer",orderId)
        // console.log("product",productId)

        const orderDetails = await orderModel.findOne({_id:orderId})
        const order = await orderModel.aggregate([
            {
              $match: { _id: new mongoose.Types.ObjectId(orderId) }
            },
            {
              $unwind: '$details'
            },
            {
              $match: { 'details.productId': new mongoose.Types.ObjectId(productId) }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "details.productId",
                    foreignField: "_id",
                    as: "productDetls"
                }
            },
            {
                $unwind: "$productDetls"
            }
            
          ]);
        const addressId =  orderDetails.delivery_address
        // console.log("ID", addressId)

        const userAddress = await addressModel.aggregate([
            {
              $match: { userId: userId }
            },
            {
              $unwind: '$address'   
            },
            {
              $match: { 'address._id': new mongoose.Types.ObjectId(addressId) }
            }
           
          ]);

        console.log("order", order);
        console.log("address", userAddress[0]);  
        
        res.render('order-view',{order:order[0],address:userAddress[0]});
    }catch(error){
        next(error);
    }
}
                    

module.exports = {
    orderPlace,
    loadOrder,
    orderCancel,
    viewOrder
   
}
