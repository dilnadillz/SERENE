const mongoose = require('mongoose');

const adddressSchema = new mongoose.Schema({
    userId : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', //reference to the user model
      required: true,
    },
    address: [
      {
      userName: String,
      mobileNumber: String,
      country: String,
      state: String,
      address: String,
      city: String,
      pincode: String,
      
    }
  ]

});

module.exports = mongoose.model('Address', adddressSchema);