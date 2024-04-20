const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const AdminModel = require("../models/adminModel");
const UserModel = require('../models/userModel');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const orderModel = require('../models/orderModel')
const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const moment = require('moment');


const adminlogin = async (req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message);
    }
}       

const verifyLogin = async (req, res,next) => {
    try {
        const {email,password} = req.body;
        console.log(email);
        const adminData = await AdminModel.findOne({ email: email });

        if (adminData) {

            if (password === adminData.password) {
            
                    function createTokens(adminId) {
                        const secretKey = process.env.ACCESS_TOKEN_SECRET;
                        const expiresIn = '30d';
                        const token = jwt.sign({ adminId }, secretKey, { expiresIn });
                        return token;
                    }
                    const token = createTokens(adminData._id);
                    // console.log("access token is: " + token);
                    res.cookie("admin-token", token, {
                        maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
                        httpOnly: true,
                    });

                
                res.redirect('/admin/dashboard');
            } else {
                res.render('adminLogin', { message: "Invalid user" });
            }
        } else {
            res.render('adminLogin', { message: "Email and password are incorrect" });
        }
    } catch (error) {
        next(error);
        res.render('adminLogin', { message: "An error occurred" });
    }
};

const adminWelcome = async (req, res,next) => {
    try {
        //data fetchig in chart
        const dailyOrderData = await orderModel.aggregate([
            {
                $match: { date: { $gte: new Date(moment().subtract(30, "days").startOf("day")) } }//based on date field it filters orders on last 30 days
            },
            {
                $group: {_id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },//group oders by date
                  orderCount: { $sum: 1 },//calculating number of orders on each date
                },
              },
              {
                $sort: { _id: 1 },//sorting it in asnding order
              },
          
        ])
        // console.log("dailyOrderData",dailyOrderData);

        const dailyDetls = dailyOrderData.map((item)=> item._id);
        const dailyOrder = dailyOrderData.map((item)=> item.orderCount);
        // console.log("dailyDetls",dailyDetls);
        // console.log("dailyOrder",dailyOrder);


        const monthlyOrderData = await orderModel.aggregate([
            {
                $group: {_id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                  orderCount: { $sum: 1 },
                },
              },
              {
                $sort: { _id: 1 },
              },
        ])
        // console.log("monthlyOrderData",monthlyOrderData);

        const monthlyDetls = monthlyOrderData.map((item)=> item._id);
        const monthlyOrder = monthlyOrderData.map((item)=> item.orderCount);
        // console.log("monthlyDetls",monthlyDetls);
        // console.log("monthlyOrder",monthlyOrder);

        //best selling product
        const bestProducts = await orderModel.aggregate([
            {
                $unwind: "$details"
            },
            {
                $group:{_id:"$details.productId", productName:{$first:"$details.productId.productName"},brand:{$first:"$details.brand"},category:{$first:"$details.category"}}
            }
        ])

        console.log("bestProducts",bestProducts);
        res.render('dashboard',{dailyDetls,dailyOrder,monthlyDetls,monthlyOrder});
    } catch (error) {
        next(error);
    }
}

const loadCustomers = async (req, res,next) => {
    try {

        const userData = await UserModel.find();
        console.log(userData);
        res.render('customers', { users: userData });
    } catch (error) {
        next(error);
    }   
}

const blockUser = async (req, res,next) => {
  try {
    const {userId} = req.params;
    const user = await UserModel.findByIdAndUpdate(userId, { is_blocked: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.redirect('/admin/customers'); 
  } catch (error) {
    next(error);
    
  }
};

const unblockUser = async (req, res,next) => {
  try {
    const {userId} = req.params;
    const user = await UserModel.findByIdAndUpdate(userId, { is_blocked: false });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.redirect('/admin/customers'); 
  } catch (error) {
    next(error);
  }
};



const adminLogout = async (req, res,next) => {
    try {
        res.clearCookie("admin-token"); 
        res.redirect('/admin'); 
    } catch (error) {
        next(error);
    }
}

const loadUserOrder = async(req,res,next) => {
    try{
        orderData = await orderModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userz"
                }
            },
            {
                $unwind: "$userz"
            },
            {
                $sort:{date: -1}
            }
        ])
       
        // console.log("order coming",orderData)
        
        
        res.render('order',{orderData:orderData});
    }catch(error){
        next(error);
    }
}


const loadUserOrderDetails = async(req,res,next) => {
    try{
        const {orderId} = req.query;
      
        const orderData = await orderModel.findById({_id:orderId});

        const adminOrder = await orderModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(orderId) }
            },
            {   
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userz"
                }
            },
            {
                $unwind: "$userz"
            },
            {
                $unwind: '$details'
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
         
        ])

        
        // console.log("us",orderData)
        // console.log("ad",adminOrder)
        res.render('order-details',{order:adminOrder[0]});
    }catch(error){
        next(error);
    }
}   

const updateOrderStatus = async(req,res,next)  => {
    try{
        const {orderId,productId,orderStatus} =req.body;
        console.log("odrid",orderId)
        console.log("prdtid",productId)

        const order = await orderModel.findOneAndUpdate(
            { _id: orderId, "details.productId": productId },
            { $set: { "details.$.status": orderStatus } },
            { new: true }
        );
      
       
        res.status(200).json({order , message: "Order status updated successfully"});
       
    }catch(error){
    next(error);
    }
}

const orderApproveOrReject =async(req,res,next) => {
    try{
        const {orderId,productId,decision} = req.body;
        console.log("ord",orderId);
        console.log("prd",productId);
        
        //updating return status based on the decision
        const orderStatus = await orderModel.findOneAndUpdate(
            {_id:orderId, "details.productId":productId},
            {$set:{"details.$.returnStatus":decision}},
            {new: true}
        );
        console.log("orderstatus",orderStatus);
        

        res.status(200).json({orderStatus})

    }catch(error){
        next(error);    
    }
}

const loadSalesReport = async(req,res,next) => {
    try{
        const salesData = await orderModel.find({"details.status":"Delivered"}).populate('details.productId').sort({date:-1})
        .exec();
        console.log("sales",salesData)
        res.render('salesReport',{salesData});
    }catch(error){
        next(error);
    }
}
    
const filterSalesReport = async(req,res,next) => {
    try {
      const {startDate,endDate} = req.query;
      const fromDate = new Date(startDate);
      const toDate = new Date(endDate);
      toDate.setHours(23, 59, 59, 999); 
      const salesData = await orderModel.find({
        date: { $gte: fromDate, $lte: toDate },
        "details.status": "Delivered",
      });
      res.render("salesReport", { salesData });
    } catch (error) {
      next(error);
    }
};

const salesPdf = async(req,res,next) => {
    try{
     
    const salesData = await orderModel.find({"details.status":"Delivered"}).populate('details.productId');

    const data = {
        salesData: salesData
    }

     //render ejs template
     const salesPdfPath = path.join(__dirname,'../views/admin/salesPdf.ejs');
     const invoiceHtml = ejs.render(fs.readFileSync(salesPdfPath, 'utf8'), data);

     //generate pdf invoice
     const browser = await puppeteer.launch({ headless: 'new'});
     const page = await browser.newPage();
     await page.setContent(invoiceHtml);
     const pdfBuffer = await page.pdf({format: 'A4'});
     await browser.close();

     //send the pdf as dwnld
     res.setHeader('Content-Type', 'application/pdf');
     res.setHeader('Content-Disposition', 'attachment; filename="salesReport.pdf"');
     res.send(pdfBuffer);

    }catch(error){
        next(error);
    }
}
  

module.exports = {
    adminlogin,
    verifyLogin,
    adminWelcome,
    loadCustomers,
    blockUser, 
    unblockUser,
    adminLogout,
    loadUserOrder,
    loadUserOrderDetails,
    updateOrderStatus,
    orderApproveOrReject,
    loadSalesReport,
    filterSalesReport,
    salesPdf

  
}