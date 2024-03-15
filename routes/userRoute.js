const express = require("express");
const user_route = express();
const usercontroller = require('../controllers/usercontroller');
const UserModel = require('../models/userModel'); 
const AddressModel = require('../models/addressModel');
const router = express.Router();
user_route.set('view engine','ejs');
user_route.set('views','./views/users');
const bodyParser = require('body-parser');

const {requireAuth,checkUser,isUser} = require('../middlewear/authMiddleware');
user_route.use(checkUser)

const {checkBlockUser} = require('../middlewear/checkBlockUser');




user_route.get('/',checkBlockUser,usercontroller.welcome);

user_route.get('/register',isUser,usercontroller.loadRegister);

user_route.post('/register',usercontroller.signUp);

user_route.post('/resend',usercontroller.resendOtp);

user_route.post('/verify',usercontroller.verifyOtp);

user_route.get('/login',isUser,usercontroller.loadLogin)

user_route.post('/login',usercontroller.verifyLogin);

user_route.get('/logout',usercontroller.logout);

user_route.get('/productlist',checkBlockUser,usercontroller.loadProductlist);

user_route.get('/product/:productId',checkBlockUser,usercontroller.loadUserProduct);
  
user_route.get('/account-personal-info',checkBlockUser,usercontroller.LoadPersonalInfo);

user_route.post('/account-personal-info',checkBlockUser,usercontroller.editPersonalInfo);

user_route.get('/account-address',checkBlockUser,usercontroller.loadAddress);

user_route.get('/account-address-add',checkBlockUser,usercontroller.loadAddAddress);

user_route.post('/account-address',usercontroller.addingAddress);

user_route.get('/account-address-edit/:addressId',checkBlockUser,usercontroller.loadEditAddress);

user_route.post('/account-address/:addressId',usercontroller.editingAddress);

user_route.get('/account-address-delete/:addressId',usercontroller.removeAddress);

user_route.get('/checkout',checkBlockUser,usercontroller.loadCheckout);

// user_route.post('/product-filter',usercontroller.productFilter);



user_route.get('/404',checkBlockUser,usercontroller.load404);







module.exports = user_route