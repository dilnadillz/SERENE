const express = require("express");
const app = express();
const product_route = express();
const productModel = require("../models/productModel");
const productController = require("../controllers/productController");
const multer = require("multer");
product_route.set('view engine','ejs');
product_route.set('views','./views/admin');
app.set('views', './views');


const {requireAdminAuth,checkAdmin} = require('../middlewear/authMiddleware');
product_route.use(checkAdmin)





product_route.get('/products',requireAdminAuth,productController.loadProductList);

product_route.get('/productsadd',requireAdminAuth,productController.loadProductAdd);

product_route.post('/productsadd',productController.upload.array('productImage', 5),productController.productsAdding);

product_route.get('/productsedit/:productId',productController.editProducts);

product_route.post('/products/productsedit/:productId', productController.upload.array('newImage', 10), productController.uploadProducts);

product_route.post('/products/remove/:productId',productController.removeProducts);

product_route.delete('/products/:productId/:imageIndex',productController.removeSingleImage);






module.exports = product_route;