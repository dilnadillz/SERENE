const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', //reference to the user model
      required: true,
    },
    products: [
      {
      productId:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        default: 1
      }
    },
    
  ],
  couponApplied :{
    type: String
  }

});

module.exports = mongoose.model('Cart', cartSchema);