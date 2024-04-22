const mongoose = require('mongoose')

const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fs = require('fs');

const productModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const cartModel = require('../models/cartModel');
const addressModel = require('../models/addressModel');
const orderModel = require('../models/orderModel');
const Razorpay = require('razorpay');
const walletModel = require('../models/walletModel');

const instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});

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

        //reduce stock after sucessfull order placement
        for(const product of cart.products){
            await productModel.updateOne(
                {_id:product.productId},
                {
                    $inc: {stock: -product.quantity}
                }
            )
        }

        await cartModel.findOneAndDelete({userId:userId});

        res.status(200).json({ order, message: 'order updated successfully.' });
    }catch(error){
        next(error);
    }
}



const loadOrder = async (req, res,next) => {
    try {
        const userId = res.locals.user;
        const page = parseInt(req.query.page) || 1;
        const pageSize = 5; // Number of orders per page

        const totalOrders = await orderModel.countDocuments({ userId: userId });
        const totalPages = Math.ceil(totalOrders / pageSize);

        const orderData = await orderModel.find({ userId: userId })
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        console.log(orderData);

        const razorpayKey = process.env.key_id

        res.render('orders', { orderData: orderData, totalPages: totalPages, currentPage: page ,razorpayKey:razorpayKey});
  
    } catch (error) {
        next(error);
    }
}       

const orderCancel = async(req,res,next) => {
    try{
          
        const {orderId} = req.body;
       const { productId } = req.body;
        
    
        const order = await orderModel.findOneAndUpdate({_id:orderId , 'details.productId':productId},{$set: {'details.$.status':"Cancelled"}},{new:true});
        if(!order){
            return res.status(404).json({message:'not found'})
        }
       
        //calculating the total refund amt for the cancld product
      const productIndex = order.details.findIndex(item => item.productId == productId);
      const {price,quantity,payment} = order.details[productIndex];
      const totalRefund = price*quantity;

    if (order.payment !== 'Cash on Delivery') {
      const wallet = await walletModel.findOne({userId : order.userId});

      if(!wallet){
        return res.status(404).json({message:"wallet not found"});
      }    

      wallet.balance += totalRefund;

      //update wallet with refund amount
      wallet.walletHistory.push({
        date: new Date(),
        amount: totalRefund,
        status: 'Credited (cancelled Product)'
      })

      await wallet.save();
    }
      console.log("wallw",wallet)


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
                $lookup: {
                    from: "products",
                    localField: "details.productId",
                    foreignField: "_id",
                    as: "productDetls"
                }
            }
            
          ]);

        // Save productDetls in a separate variable
        const productDetls = order[0].productDetls;

        const addressId =  orderDetails.delivery_address
        // console.log("ID", addressId)

        const userAddress = await addressModel.findOne({
            userId: userId,
            'address._id': addressId
        });

        console.log("order", order);
        console.log("address", userAddress);  
        
        res.render('order-view',{order:order[0],address:userAddress,productDetls: productDetls});
    }catch(error){
        next(error);
    }
}               

const razorpayPayment = async(req,res,next) => {
    try{
        const userId = res.locals.user;

        const cart = await cartModel.findOne({userId:userId}).populate({path: "products.productId"})
        if(!cart){
            return res.status(404).json({ message: "Cart not found" });
        }
        // Calculated total amount by iterating over the products and summing up their prices
        let totalAmount = 0;
        cart.products.forEach(product => {
            totalAmount += product.productId.price * product.quantity;
        });
            
      console.log("mm",cart)
      console.log("kk",totalAmount)
      
        // Use this endpoint to create an order using the Orders API.
        const razor = {
            amount: totalAmount *100, //Convert the total amount to paisa (multiply by 100)
            currency: "INR",
            receipt: "orderId",
        }
        // console.log("amount",totalAmount);
        console.log("razor",razor); 

        const order = await instance.orders.create(razor);
        console.log("hey",order)
        res.status(200).json(order);

    }catch(error){  
        next(error);
    }
}   

const orderReturn = async(req,res,next) => {
    try{
        const {orderId,productId,returnReason} = req.body;
        console.log("o",orderId)
        console.log("p",productId)
        console.log("r",returnReason)

        const order = await orderModel.findOneAndUpdate({_id:orderId, 'details.productId':productId},{$set:{'details.$.returnStatus': 'return'}},{new:true})

        console.log('kll',order)
        res.status(200).json(order);    

    }catch(error){
        next(error);    
    }
}

const orderInvoiceGenerate = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        const {orderId} = req.query;

        const user = await UserModel.findById(userId);
        console.log("user",user)
        // const order = await orderModel.findOne({_id:orderId,userId: userId}).populate('details.productId');
        const order = await orderModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(orderId) }
              },
              {
                  $lookup: {
                      from: "products",
                      localField: "details.productId",
                      foreignField: "_id",
                      as: "productz"
                  }
              },
              {
                $unwind:"$productz"
              }
              
        ])
        console.log("order",order);

        const addressId =  order[0].delivery_address
       

        const userAddress = await addressModel.findOne({
            userId: userId,
            'address._id': addressId
        });

         console.log("userAddress", userAddress)
        
        const data = {
            user : user,
            order: order,
            address:userAddress
        }           

        //render ejs template
        const invoiceTemplatePath = path.join(__dirname,'../views/users/invoice.ejs');
        const invoiceHtml = ejs.render(fs.readFileSync(invoiceTemplatePath, 'utf8'), data);

        //generate pdf invoice
        const browser = await puppeteer.launch({ headless: 'new'});
        const page = await browser.newPage();
        await page.setContent(invoiceHtml);
        const pdfBuffer = await page.pdf({format: 'A4'});
        await browser.close();

        //send the pdf as dwnld
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
        res.send(pdfBuffer);

       
    }catch(error){
        next(error);
    }   
}       

const pendingPayment = async(req,res,next) => {
    try{
        const {orderId} = req.body;
        //retrving order detls from db
        const order = await orderModel.findById(orderId);
        if(!order){
            return res.status(404).json({message:"order not found"})
        }
        console.log("sdfsdf","order")
         // Calculated total amount by iterating over the products and summing up their prices
         let totalAmount = 0;
         cart.products.forEach(product => {
             totalAmount += product.productId.price * product.quantity;
         });

        //check order statusis pending
        if(order.details[0].status !== "Pending"){
            return res.json({message:"order not pending"})
        }

        const paymentOptions = {
            amount: order.totalAmount * 100, 
            currency: 'INR',
            receipt: `orderId`, 
        };

         // Create a new Razorpay order
         instance.orders.create(paymentOptions, async (err, orderData) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to create Razorpay order', error: err });
            }

            // Update the existing order with the new Razorpay order ID
            order.razorpay_order_id = orderData.id;
            await order.save();

            return res.status(200).json({ message: 'Razorpay order created successfully', order });
        });
    }catch(error){
        next(error);
    }
}

module.exports = {
    orderPlace,
    loadOrder,
    orderCancel,
    viewOrder,
    razorpayPayment,
    orderReturn,
    orderInvoiceGenerate,
    pendingPayment
   
}
