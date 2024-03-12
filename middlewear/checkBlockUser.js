const jwt = require("jsonwebtoken");
const UserModel = require('../models/userModel');

const checkBlockUser = async (req, res, next) => {
    try {
        if (res.locals.user) {
            const user = await UserModel.findById(res.locals.user._id);
            if (user && user.is_blocked) { 
                res.clearCookie('access-token');
                res.locals.user = null;
            }
        }
        next();
    } catch (error) {
        console.error(error);
    }
};

module.exports = {
    checkBlockUser
};
