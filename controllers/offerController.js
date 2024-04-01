const mongoose = require('mongoose');
const path = require('path');
const offerModel = require("../models/offerModel");
const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');




const loadOfferList = async (req, res, next) => {
    try {
        const offerData = await offerModel.find();
        // console.log("offercoming",offerData);        
        res.render('offers', { offerData });
    } catch (error) {
        next(error);
    }
}

const loadOfferAdd = async (req, res, next) => {
    try {
        res.render('offersadd');
    } catch (error) {
        next(error);
    }
}

const addOffer = async (req, res, next) => {
    try {
        const { name, startingDate, expiryDate, percentage, status } = req.body;
        // console.log('kk',req.body)
        const newOffer = new offerModel({
            name,
            startingDate,
            expiryDate,
            percentage,
            status: "Active"
        })

        await newOffer.save();
        res.redirect('offers');
    } catch (error) {
        next(error);
    }
}

const removeOffer = async (req, res, next) => {
    try {
        const { offerId } = req.params;
        const remove = await offerModel.findByIdAndDelete({ _id: offerId });
        if (remove) {
            // console.log("q",remove);
            res.redirect('/admin/offers');
        }
    } catch (error) {
        next(error);
    }
}

const addOfferInProduct = async(req,res,next) => {
    try {
        const { offerId, productId } = req.body;
        // console.log("::::", req.body.offerId);
        // console.log("{{{{{", req.body.productId);

        const offerData = await offerModel.findOne({ _id: offerId });
        //set the  offer field with the specified offerid
        const productOfferAdd = await productModel.findByIdAndUpdate({ _id: productId }, { $set: { offer: offerId } }, { new: true })
        // console.log("kk", productOfferAdd);
        res.status(200).json({ offerData, productOfferAdd, sucess: "true" });
    } catch (error) {
        next(error);
    }
}

const removeOfferInProduct = async(req,res,next) => {
    try{
        const {productId} = req.body;
        const productOfferRemove = await productModel.findByIdAndUpdate({_id:productId},{$set: {offer: null}},{new:true});
        res.status(200).json({productOfferRemove,sucess:"true"});
    }catch(error){
        next(error);
    }
}

const addOfferInCategory = async(req,res,next) => {
    try{
        const {offerId,categoryId} =req.body;
        console.log("cat",categoryId);
        console.log("off",offerId)

        const catOfferData = await offerModel.findOne({_id:offerId});
        const categoryOfferAdd = await categoryModel.findByIdAndUpdate({_id:categoryId},{$set:{offer:offerId}},{new:true});
        res.status(200).json({catOfferData,categoryOfferAdd,sucess:"true"})
    }catch(error){
        next(error);
    }
}

const removeOfferInCategory = async(req,res,next) => {
    try{
        const {categoryId} = req.body;
        const categoryOfferRemove = await categoryModel.findByIdAndUpdate({_id:categoryId},{$set: {offer: null}},{new:true});

        res.status(200).json({categoryOfferRemove, sucess:"true"});
    }catch(error){
        next(error);
    }
}


module.exports = {
    loadOfferList,
    loadOfferAdd,
    addOffer,
    removeOffer,
    addOfferInProduct,
    removeOfferInProduct,
    addOfferInCategory,
    removeOfferInCategory
    
}