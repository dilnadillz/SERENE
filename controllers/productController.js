const productModel = require('../models/productModel');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/productUploads');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });


  
const loadProductList = async(req,res)=>{
    try{
        const productsData = await productModel.find();
        console.log(productsData);
        res.render('products', { productsData: productsData });

    }catch(error){
        console.log(error.message);
    }
}


const loadProductAdd = async(req,res)=>{
    try{
        res.render('productsadd');
    }catch(error){
        console.log(error.message);
    }
}


const productsAdding = async(req,res) => {
    try{
        
        const {productName,productDescription,category,color,stock,price} = req.body;
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
        console.log("frdf",newProduct);
        if(productData){
            res.redirect('/admin/products');
        }else{
            res.render('/productsadd',{message:'something went wrong'});
        }

    }catch(error){
        console.log(error.message);
    }
}


const editProducts = async(req,res)=>{
    try{
        const {productId} = req.params;
        const productData = await productModel.findOne({ _id: productId });

        if (productData) {
            res.render('productsedit', { product: productData });
        }
    }catch(error){
        console.log(error.message);
    }

};

const uploadProducts = async (req, res) => {
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
        console.log(error.message);
    }
};

const removeProducts = async(req,res) =>{
    try{
        const {productId} = req.params;
        const result = await productModel.findOneAndDelete({ _id: productId });
        if (result) {
            console.log(productId);
            res.redirect('/admin/products');
        }    
    }catch(error){
        console.log(error.message);
    }
}

const removeSingleImage = async(req,res) => {
    try{
        const {productId} = req.params;
        const {imageIndex} = req.params;
        console.log("kkk",productId,imageIndex)
       
        const existingProduct = await productModel.findById(productId);
        if(!existingProduct){
            return res.send('product not find');
        }

       

        existingProduct.productImage.splice(imageIndex,1)

        await existingProduct.save();

        res.json({sucess:true,message:'image delete sucessfully'})
    }catch(error){
        console.log(error.message);
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