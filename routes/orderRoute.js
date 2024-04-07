const express = require("express");
const app = express();
const order_route = express();
order_route.set('view engine','ejs');
order_route.set('views','./views/users');

const UserModel = require('../models/userModel');
const orderController = require('../controllers/orderController');

const {checkBlockUser} = require('../middlewear/checkBlockUser');




order_route.post('/place-order',orderController.orderPlace);

order_route.get('/orders',checkBlockUser,orderController.loadOrder);

order_route.post('/cancel-order',orderController.orderCancel);

order_route.get('/orderview',checkBlockUser,orderController.viewOrder);

order_route.post('/razorpay-payment',orderController.razorpayPayment);

order_route.post('/order-return',orderController.orderReturn);



module.exports = order_route