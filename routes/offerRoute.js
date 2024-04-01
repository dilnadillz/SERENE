const express = require("express");
const app = express();
const offer_route = express();
// const productModel = require("../models/productModel");
const offerController = require("../controllers/offerController");
offer_route.set('view engine','ejs');
offer_route.set('views','./views/admin');
app.set('views', './views');



offer_route.get('/offers',offerController.loadOfferList);

offer_route.get('/offersadd',offerController.loadOfferAdd);

offer_route.post('/offersadd',offerController.addOffer);

offer_route.post('/offers/remove/:offerId',offerController.removeOffer);

offer_route.post('/addProductOffer',offerController.addOfferInProduct);

offer_route.post('/deleteProductOffer',offerController.removeOfferInProduct);

offer_route.post('/addCategoryOffer',offerController.addOfferInCategory);

offer_route.post('/deleteCategoryOffer',offerController.removeOfferInCategory);


module.exports = offer_route;