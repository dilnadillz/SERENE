const mongoose = require('mongoose')

const productModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const cartModel = require('../models/cartModel');
const addressModel = require('../models/addressModel');
const orderModel = require('../models/orderModel');



const orderPlace = async(req,res) => {
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
        // console.log("cart",cart)
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

        res.status(200).json({ order, message: 'order updated successfully.' });
    }catch(error){
        console.log(error.message);
    }
}



const loadOrder = async (req, res) => {
    try {

        const orderData = await orderModel.find();
        // console.log(orderData)
        res.render('orders',{orderData:orderData});
    } catch (error) {
        console.log(error.message);
    }
}       

const orderCancel = async(req,res) => {
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
        console.log(error.message);
    }
}




module.exports = {
    orderPlace,
    loadOrder,
    orderCancel
   
}
