const mongoose = require('mongoose');

const categorySchema =new mongoose.Schema({
  categoryName: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offers',
   
  }
});

module.exports = mongoose.model("Category", categorySchema);
