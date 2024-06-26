const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_blocked: {
    type: Boolean,
    default: false, 
  },
  referralCode: {
    type: String
  }
});


const UserModel = mongoose.model('user', userSchema);

module.exports = UserModel;