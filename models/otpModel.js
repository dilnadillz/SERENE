const mongoose = require('mongoose');

// Define the OTP schema
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date, 
    default: Date.now
},
expiry: { 
    type: Date, 
    expires: '5m', // Set TTL to 5 minutes
    default: Date.now() + 300000 // Set default value to the current time + 5 minutes in milliseconds
}
})
// Create the OTP model
const OtpModel = mongoose.model('Otp', otpSchema);

module.exports = OtpModel;
