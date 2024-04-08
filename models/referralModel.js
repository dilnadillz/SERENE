const mongoose = require('mongoose');

const referralSchema =new mongoose.Schema({
    referrerReward: {
        type: Number,
        required: true
    },
    referreeBonus: {
        type: Number,
        required: true
    },
});

module.exports = mongoose.model("Referral", referralSchema);