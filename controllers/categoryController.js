const CategoryModel = require("../models/categoryModel");
const multer = require('multer');
const path = require('path');
const categoryModel = require("../models/categoryModel");


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/categoryUploads');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });




  const loadCategoryList = async (req, res) => {
    try {
        const catgoryData = await CategoryModel.find();
        console.log(catgoryData);
        res.render('category', { catgoryData: catgoryData });
    } catch (error) {
        console.log(error.message);
    }
}


const loadAddCategory = async (req, res,next) => {
    try {

        res.render('categoryadd');
    } catch (error) {
        next(error);
    }
}


const catgoryAdding =async(req,res,next) =>{
    try {


        const matchingCategory = await categoryModel.findOne({ categoryName: { $regex: new RegExp(req.body.categoryName, "i") } });
    

        if (matchingCategory) {
          return res.render("categoryadd");
        }



        const cat = new CategoryModel({

            categoryName: req.body.categoryName,
            image: `/categoryUploads/${req.files[0].filename}`
          });
          
        const catData = await cat.save();
        
          console.log("sss", cat);
        if(catData){
            res.redirect('/admin/category');
        }else{
            res.render('categoryadd',{message:'something went wrong'});
        }
        
    } catch (error) {
        next(error);
    }
};

const editCategory = async(req,res,next)=>{
    try{
        const {categoryId} = req.params;
        const category = await CategoryModel.findOne({ _id: categoryId });
        res.render('categoryedit', { category: category })
    }catch(error){
        next(error);
    }

};

const uploadCategory = async(req,res,next)=>{
    try{
        const {categoryId} = req.params;
      
        const matchingCategory = await categoryModel.findOne({ categoryName: { $regex: new RegExp(req.body.categoryName, "i") } });
    

        if (matchingCategory) {
          return res.render("categoryadd");
        }


        if(req.files && req.files[0]){
            await CategoryModel.updateOne({_id: categoryId}, {$set: {
                categoryName: req.body.categoryName,
                image: `/categoryUploads/${req.files[0].filename}`
            }})
        }else{
            await categoryModel.updateOne({_id:categoryId},{$set:{
                categoryName: req.body.categoryName
            }})
        }
       

        res.status(200).redirect('/admin/category');
    }catch(error){
        next(error);
    }
}

const removeCategory = async(req,res,next) =>{
    try{
        const {categoryId} = req.params;
        const result = await CategoryModel.findOneAndDelete({ _id: categoryId });
        if (result) {
            console.log(categoryId);
            res.redirect('/admin/category');
        }    
    }catch(error){
        next(error);
    }
}







module.exports = {
    loadCategoryList,
    loadAddCategory,
    catgoryAdding ,
    upload,
    editCategory,
    uploadCategory,
    removeCategory

}