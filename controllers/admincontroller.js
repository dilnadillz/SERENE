const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const AdminModel = require("../models/adminModel");
const UserModel = require('../models/userModel');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const orderModel = require('../models/orderModel')

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
        res.render('dashboard');
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
    orderApproveOrReject

  
}