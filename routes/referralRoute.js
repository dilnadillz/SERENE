const express = require("express");
const app = express();
const referral_route = express();
const referralController = require("../controllers/referralController");
referral_route.set('view engine','ejs');
referral_route.set('views','./views/admin');
app.set('views', './views');



referral_route.get('/referral',referralController.loadReferralOffer);

referral_route.get('/referralAdd',referralController.loadReferralAddOffer);

referral_route.post('/referralAdd',referralController.addReferralOffer);

referral_route.post('/referral/remove/:referralId',referralController.removeReferral);





module.exports = referral_route;