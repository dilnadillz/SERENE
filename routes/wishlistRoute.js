const express = require("express");
const app = express();
const wishlist_route = express();
wishlist_route.set('view engine','ejs');
wishlist_route.set('views','./views/users');

const UserModel = require('../models/userModel');
const wishlistController = require('../controllers/wishlistController')

const {requireAuth,checkUser,isUser} = require('../middlewear/authMiddleware');
wishlist_route.use(checkUser)

const {checkBlockUser} = require('../middlewear/checkBlockUser');

wishlist_route.get('/wishlist',requireAuth,checkBlockUser,wishlistController.loadWishlist);

wishlist_route.post('/wishlist-add',requireAuth,wishlistController.addToWishlist);

wishlist_route.delete('/wishlist/remove/:productId',requireAuth,wishlistController.removeWishlist);


module.exports = wishlist_route