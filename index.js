const express = require("express");
const path = require('path');
const dotenv = require('dotenv').config({ path: path.resolve(__dirname, 'config', '.env') });
const {errorHandler} = require('./middlewear/errorMiddlewear')
const app = express();
const connectDb = require('./config/db')
connectDb();

require('dotenv').config({path: './config/.env'});
console.log(process.env.ACCESS_TOKEN_SECRET)
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

app.use(cookieParser())
app.use(express.static('public'));
// app.use(morgan('dev'));

app.use(errorHandler)

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json());
app.set('views' , './views/users');
app.set('views' , './views/admin');

app.use(express.static('uploads'));

const user_route = require('./routes/userRoute');
app.use('/' , user_route);

const admin_route = require('./routes/adminRoute');
app.use('/admin',admin_route);

const category_route = require('./routes/categoryRoute');
app.use('/admin', category_route);

const product_route = require('./routes/productRoute');
app.use('/admin',product_route);

const offer_route = require('./routes/offerRoute');
app.use('/admin',offer_route);

const referral_route = require('./routes/referralRoute');
app.use('/admin',referral_route);

const coupon_route = require('./routes/couponRoute');
app.use('/admin',coupon_route);

const cart_route = require('./routes/cartRoute');
app.use('/',cart_route);

const order_route = require('./routes/orderRoute');
app.use('/',order_route);

const wishlist_route = require('./routes/wishlistRoute');
app.use('/',wishlist_route);

const PORT = process.env.PORT||3000 
app.listen(PORT,function(){
    console.log(`server is running http://localhost:${PORT}/`);
})
