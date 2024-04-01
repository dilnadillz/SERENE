const mongoose = require('mongoose');
const productModel = require('../models/productModel');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const categoryModel = require('../models/categoryModel');
const offerModel = require('../models/offerModel');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/productUploads');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });


const loadProductList = async(req,res,next)=>{
    try{
        const offerId = await offerModel.find();
        const productsData = await productModel.find().populate('category').populate('offer');
        console.log(productsData);
        // console.log("hey offer",offerId);
      
        res.render('products', { productsData: productsData,offerId});

    }catch(error){
        next(error);    
    }
}       


const loadProductAdd = async(req,res,next)=>{
    try{
        const catData = await categoryModel.find();
        // console.log('catdata',catData)
        res.render('productsadd',{catData:catData});
    }catch(error){
        next(error);
    }
}

const productsAdding = async(req,res,next) => {
    try{
        
        const {productName,productDescription,category,color,stock,price} = req.body;
        // console.log("hey",category);
        const uploadedImg = req.files.map(file => `/productUploads/resizedImg${file.filename}`);
      
         req.files.map(async file => {
            await sharp(path.join(__dirname, `../uploads/productUploads/${file.filename}`))
                .resize(540, 640, {
                    fit: "cover",
                    position: "centre",
                })
                .toFile(path.join(__dirname, `../uploads/productUploads/resizedImg${file.filename}`));
        });


        const newProduct = new productModel({
            productName, 
            productDescription,
            category,
            color,
            stock,
            price,
            productImage : uploadedImg
        });

        const productData = await newProduct.save();
        // console.log("frdf",newProduct);
        if(productData){
            res.redirect('/admin/products');
        }else{
            res.render('/productsadd',{message:'something went wrong'});
        }

    }catch(error){
        next(error);
    }
}


const editProducts = async(req,res,next)=>{
    try{
        const {productId} = req.params;
        const catData = await categoryModel.find();
        const productData = await productModel.findOne({ _id: productId });

        if (productData) {
            res.render('productsedit', { product: productData ,catData});
        }
    }catch(error){
        next(error);
    }

};

const uploadProducts = async (req, res,next) => {
    try {
        const {productId} = req.params;
        const product = await productModel.findById(productId);

        if (!req.files && req.files.length === 0) {
            return res.status(401).redirect(`/productsedit/${productId}`)
        }

        const uploadedImg = req.files.map(file => `/productUploads/${file.filename}`);
        
      


        await productModel.updateOne({_id: productId}, {$set: req.body,$push: {productImage: uploadedImg}});

        res.status(200).redirect('/admin/products');
    } catch (error) {
        next(error);
    }
};

const removeProducts = async(req,res,next) =>{
    try{
        const {productId} = req.params;
        const result = await productModel.findOneAndDelete({ _id: productId });
        if (result) {
            // console.log(productId);
            res.redirect('/admin/products');
        }    
    }catch(error){
        next(error);
    }
}
        
const removeSingleImage = async(req,res,next) => {
    try{
        const {productId} = req.params;
        const {imageIndex} = req.params;
        // console.log("kkk",productId,imageIndex)
       
        const existingProduct = await productModel.findById(productId);
        if(!existingProduct){
            return res.send('product not find');
        }

       
        //removing the image path from the products image array
        existingProduct.productImage.splice(imageIndex,1)

        await existingProduct.save();

        res.json({sucess:true,message:'image delete sucessfully'})
    }catch(error){
        next(error);
    }           
}
            
module.exports = {
    loadProductList,
    loadProductAdd,
    productsAdding,
    upload,
    editProducts,
    uploadProducts,
    removeProducts,
    removeSingleImage
}