const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({

    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', 
        required: true,
    },
    balance : {
        type: Number,
        default: 0
    },
    walletHistory: [
        {
            date: {
                type: Date
            },
            amount: {
                type : Number
            },
            status: {
                type: String
            },
            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Order'
            }
            
        }
    ]
})

module.exports = mongoose.model('Wallet', walletSchema)