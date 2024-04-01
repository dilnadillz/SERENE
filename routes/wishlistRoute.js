const express = require("express");
const app = express();
const wishlist_route = express();
wishlist_route.set('view engine','ejs');
wishlist_route.set('views','./views/users');

const UserModel = require('../models/userModel');
const wishlistController = require('../controllers/wishlistController')

const {checkBlockUser} = require('../middlewear/checkBlockUser');

wishlist_route.get('/wishlist',checkBlockUser,wishlistController.loadWishlist);

wishlist_route.post('/wishlist-add',wishlistController.addToWishlist);

wishlist_route.delete('/wishlist/remove/:productId',wishlistController.removeWishlist);


module.exports = wishlist_route