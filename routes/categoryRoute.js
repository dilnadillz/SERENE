const express = require("express");
const category_route = express();
const bodyParser = require("body-parser");
const CategoryModel = require("../models/categoryModel");
const categoryController = require("../controllers/categoryController");
const multer = require("multer");
category_route.set('view engine','ejs');
category_route.set('views','./views/admin');

const {requireAdminAuth,checkAdmin} = require('../middlewear/authMiddleware');
category_route.use(checkAdmin)



category_route.get('/category',requireAdminAuth,categoryController.loadCategoryList);

category_route.get('/categoryadd',requireAdminAuth,categoryController.loadAddCategory);

category_route.post('/categoryadd',categoryController.upload.array('image', 1),categoryController.catgoryAdding );

category_route.get('/categoryedit/:categoryId',categoryController.editCategory);

category_route.post('/category/categoryedit/:categoryId',categoryController.upload.array('newImage',1), categoryController.uploadCategory);

category_route.post('/category/remove/:categoryId', categoryController.removeCategory);





module.exports = category_route;