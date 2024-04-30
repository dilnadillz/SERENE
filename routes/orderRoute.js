const express = require("express");
const app = express();
const order_route = express();
order_route.set('view engine','ejs');
order_route.set('views','./views/users');

const UserModel = require('../models/userModel');
const orderController = require('../controllers/orderController');

const {checkBlockUser} = require('../middlewear/checkBlockUser');

const {requireAuth,checkUser,isUser} = require('../middlewear/authMiddleware');
order_route.use(checkUser)



order_route.post('/place-order',requireAuth,orderController.orderPlace);

order_route.get('/orders',requireAuth,checkBlockUser,orderController.loadOrder);

order_route.post('/cancel-order',requireAuth,orderController.orderCancel);

order_route.get('/orderview',requireAuth,checkBlockUser,orderController.viewOrder);

order_route.post('/razorpay-payment',requireAuth,orderController.razorpayPayment);

order_route.post('/order-return',requireAuth,orderController.orderReturn);

order_route.get('/download-invoice',requireAuth,orderController.orderInvoiceGenerate);

order_route.post('/pendingPay/:orderId',requireAuth,orderController.pendingRazorpayment);

module.exports = order_route            