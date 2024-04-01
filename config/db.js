const mongoose = require("mongoose");
function connectDb(){
    mongoose.connect(process.env.MONGO_URI) 
.then(()=>{
    console.log("MongoDB connected sucessfully");
}).catch((error)=>{
    console.error("MongoDB connection error",error);
})
}

module.exports = connectDb;   