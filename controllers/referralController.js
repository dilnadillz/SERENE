const mongoose = require('mongoose');
const referralModel = require('../models/referralModel');



const loadReferralOffer = async(req,res,next) => {
    try{
        const referrals = await referralModel.find({});
        console.log(referrals); 
        res.render('referralOffer', { referral: referrals });
    }catch(error){
        next(error);
    }
}

const loadReferralAddOffer = async(req,res,next) => {
    try{
        res.render('referralAdd')
    }catch(error){
        next(error);
    }
}

const addReferralOffer = async(req,res,next) => {
    try{
        const {referrerReward,referreeBonus} = req.body;
        console.log("hey",referrerReward);
        console.log("alo",referreeBonus);

        // Validating input
        if (!referrerReward || !referreeBonus || isNaN(referrerReward) || isNaN(referreeBonus)) {
            return res.status(400).json({ error: "Fields must be valid numbers and cannot be empty" });
        }

        //checking referral document is already exist
        const referral = await referralModel.findOne();

        //if refferral document doest exist, create new one
        if(!referral){
            const newReferral = new referralModel({
                referrerReward:referrerReward,
                referreeBonus:referreeBonus
            })
            await newReferral.save();
        }else{  //if referral document exist,update it
            referral.referrerReward = referrerReward;
            referral.referreeBonus = referreeBonus;
            await referral.save();
        }
        console.log("offer",referral)
        res.redirect('/admin/referral')
    }catch(error){
        next(error);
    }
}

const removeReferral = async(req,res,next) => {
    try{
        const {referralId} = req.params;
        console.log("id",referralId)
        const remove = await referralModel.findByIdAndDelete({ _id: referralId });
        if (remove) {
            console.log("referralremove",remove);
            res.redirect('/admin/referral');
        }
    }catch(error){
        next(error);
    }
}



module.exports ={
    loadReferralOffer,
    loadReferralAddOffer,
    addReferralOffer,
    removeReferral
}