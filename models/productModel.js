const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const productSchema =new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
        required: true
    },
    color: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    productImage: [
        {
            type: String,
            required: true
        }
    ]
});

module.exports = mongoose.model("Product", productSchema);
