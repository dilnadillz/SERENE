const express = require("express");
const app = express();
const coupon_route = express();
const couponController = require('../controllers/couponController');
coupon_route.set('view engine','ejs');
coupon_route.set('views','./views/admin');
app.set('views', './views');


coupon_route.get('/coupon',couponController.loadCoupon);

coupon_route.get('/addCoupon',couponController.loadCouponAdd);

coupon_route.post('/addCoupon',couponController.addCoupon);

coupon_route.post('/coupon/remove/:couponId',couponController.deleteCoupon);





module.exports = coupon_route;
