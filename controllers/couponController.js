const mongoose = require('mongoose');
const couponModel = require('../models/couponModel');

const loadCoupon = async(req,res,next) => {
    try{
        const coupon = await couponModel.find({})
        res.render('coupon',{coupon:coupon});
    }catch(error){
        next(error);
    }
}

const loadCouponAdd = async(req,res,next) => {
    try{
        res.render('couponAdd');
    }catch(error){
        next(error);
    }
}

const addCoupon = async(req,res,next) => {
    try{
        const {couponCode,couponDescription,minimumAmount,discount,startingDate,expiryDate} = req.body;

              // Ensure discount is a string
              const discountString = Array.isArray(discount) ? discount.join(', ') : discount;


        const coupon = new couponModel({
            couponCode,
            couponDescription,
            minimumAmount,
            discount: discountString,
            startingDate,
            expiryDate
        })
        console.log("coupon",coupon);

        await coupon.save();

        res.redirect('/admin/coupon')

    }catch(error){
        next(error);
    }
}

const deleteCoupon = async(req,res,next) => {
    try{
        const {couponId} = req.params;

        const remove = await couponModel.findByIdAndDelete(couponId);
        
        console.log("remove",remove);
        res.redirect('/admin/coupon')
    }catch(error){
        next(error);
    }
}


module.exports ={
    loadCoupon,
    loadCouponAdd,
    addCoupon,
    deleteCoupon
}