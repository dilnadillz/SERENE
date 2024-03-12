const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
  
});


// const AdminModel = mongoose.model('Admin', adminSchema);  

module.exports = mongoose.model('Admin', adminSchema);
