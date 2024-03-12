const UserModel = require('../models/userModel');
const express = require("express");
const app = express();
const cart_route = express();
cart_route.set('view engine','ejs');
cart_route.set('views','./views/users');
const bodyParser = require('body-parser');
const cartController = require('../controllers/cartController')


const {checkBlockUser} = require('../middlewear/checkBlockUser');



cart_route.get('/cart',checkBlockUser,cartController.loadCart);

cart_route.get('/addToCart/:productId',cartController.cartAdd);

cart_route.get('/cart/remove/:productId',cartController.removeCart);

cart_route.post('/updateQuantity',cartController.updateQuantity);







module.exports = cart_route