const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema ({
    couponCode:{
        type: String,
        required: true
    },
    couponDescription: {
        type: String,
        required: true
    },
    minimumAmount :{
        type: Number,
        required: false
    },
    discount : {
        type: String,
        required: true
    },
    startingDate:{
        type: Date,
        required: true
    },
    expiryDate:{
        type: Date,
        required: true
    }


})

module.exports = mongoose.model("Coupon",couponSchema);