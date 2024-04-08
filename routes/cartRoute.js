const UserModel = require('../models/userModel');
const express = require("express");
const app = express();
const cart_route = express();
cart_route.set('view engine','ejs');
cart_route.set('views','./views/users');
const bodyParser = require('body-parser');
const cartController = require('../controllers/cartController')


const {checkBlockUser} = require('../middlewear/checkBlockUser');

const {requireAuth,checkUser,isUser} = require('../middlewear/authMiddleware');
cart_route.use(checkUser)


cart_route.get('/cart',requireAuth,checkBlockUser,cartController.loadCart);

cart_route.get('/addToCart/:productId',requireAuth,cartController.cartAdd);

cart_route.get('/cart/remove/:productId',requireAuth,cartController.removeCart);

cart_route.post('/updateQuantity',requireAuth,cartController.updateQuantity);


        




module.exports = cart_route