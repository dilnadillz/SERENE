const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const AdminModel = require("../models/adminModel");
const UserModel = require('../models/userModel');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const adminlogin = async (req, res) => {
    try {
        res.render('adminLogin');
    } catch (error) {
        console.log(error.message);
    }
}       

const verifyLogin = async (req, res) => {
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
        console.log(error.message);
        res.render('adminLogin', { message: "An error occurred" });
    }
};

const adminWelcome = async (req, res) => {
    try {
        res.render('dashboard');
    } catch (error) {
        console.log(error.message);
    }
}

const loadCustomers = async (req, res) => {
    try {

        const userData = await UserModel.find();
        console.log(userData);
        res.render('customers', { users: userData });
    } catch (error) {
        console.log(error.message);
    }   
}

const blockUser = async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await UserModel.findByIdAndUpdate(userId, { is_blocked: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.redirect('/admin/customers'); 
  } catch (error) {
    console.log(error.message);
    
  }
};

const unblockUser = async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await UserModel.findByIdAndUpdate(userId, { is_blocked: false });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.redirect('/admin/customers'); 
  } catch (error) {
    console.log(error.message);
  }
};



const adminLogout = async (req, res) => {
    try {
        res.clearCookie("admin-token"); 
        res.redirect('/admin'); 
    } catch (error) {
        console.log(error.message);
    }
}









module.exports = {
    adminlogin,
    verifyLogin,
    adminWelcome,
    loadCustomers,
    blockUser, 
    unblockUser,
    adminLogout

  
}