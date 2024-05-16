const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', 
        required: true,
    },
    delivery_address: {
       name : {
        type: String,
        required: true
       },
       mobileNumber:{
        type: String,
        required: true
       },
       country:{
        type: String,
        required: true
       },
       state:{
        type: String,
        required: true
       },
       address:{
        type: String,
        required: true
       },
       city :{
        type: String,
        required: true
       },
       pincode :{
        type: String,
        required: true
       }
    }, 
    total_amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    payment: {
        type: String,
        required: true
    },
    details: [
        {
            productId:{
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product',
                required: true,
              },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            status: {
                type: String,
                default: 'Placed',
                
            },
            returnStatus: {
                type: String,
                enum: ['return', 'accepted', 'rejected'],
                // default: 'return' // Default status for a new return request
            }
            
        }
    ]
})

module.exports = mongoose.model('Order', orderSchema)