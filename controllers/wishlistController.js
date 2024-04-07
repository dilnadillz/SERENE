const mongoose = require('mongoose');
const productModel = require('../models/productModel');
const wishlistModel = require('../models/wishlistModel');


const loadWishlist = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        // console.log('helo',userId) 
        const wishlistData = await wishlistModel.aggregate([
            {
                $match: {userId:userId}
            },
            {
                $unwind: "$details"
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'details.productId',
                    foreignField: '_id',
                    as: 'detailz'
                }
            },
            {
                $unwind: "$detailz"
            },  
            // {
            //     $lookup: {
            //         from: 'offers',
            //         localField: 'detailz.offer',
            //         foreignField: '_id',
            //         as: 'offerDetails'
            //     }
            // },
            // {
            //     $unwind: '$offerDetails'
            // }
        ])
        console.log('hey',wishlistData)
        res.render('wishlist',{wishlistData});
    }catch(error){
        next(error);
    }
}

const addToWishlist = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        const {productId} = req.body;
        // console.log("u id",userId);
        // console.log('p id',productId);

        const productData = await productModel.findById(productId);
        if(!productData){
            return res.status(404).json({message:'product not found'});
        }
       
        let wishlist = await wishlistModel.findOne({userId})
        if(!wishlist){
            wishlist = new wishlistModel({
                userId:userId,
                details:[]
            });
        }   
            
       
        const productExist = wishlist.details.some(details => details.productId.toString() === productId);
        if(productExist){
            return res.status(200).json({message:'product already exist in wishlist'});
        }
        
        wishlist.details.unshift({productId:productId});
        await wishlist.save();
        console.log("..",wishlist)

        res.status(200).json({wishlist,message:'product added to the wishlist'});
        

    }catch(error){
        next(error);
    }
}

const removeWishlist = async(req,res) => {
    try{
        const userId = res.locals.user;
        const {productId} = req.params;
        console.log("er",userId)
        console.log("er",productId)
        const remove = await wishlistModel.findOneAndUpdate({ userId }, { $pull: { details: { productId } } }, { new: true });
       console.log("removnind",remove)
        if(remove){
            res.redirect('/wishlist');   
        }
        
    }catch(error){  
        next(error);
    }
}


module.exports = {
    loadWishlist,
    addToWishlist,
    removeWishlist
}