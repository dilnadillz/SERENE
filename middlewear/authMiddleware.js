const adminModel = require('../models/adminModel');
const UserModel = require('../models/userModel');
const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  console.log('authenticated');
    //   const token = req.cookies.jwt;
      const token = req.cookies['access-token'];
      
      //check json web token exists and is verified
      if (token) { 
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
          if (err) {
            console.log(err.message);
            res.redirect("/login");
          } else {
            console.log("authenticated") 
            // console.log(decodedToken.id);
            next();
            // res.redirect('/')
          }
        })
      } else {
        res.redirect("/login");
      }
    };
    
    
    const checkUser = (req, res, next) => {
        // const token = req.cookies.jwt;
       
        const token = req.cookies['access-token'];
        
      //check json web token exists and is verified
      if (token) { 
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken) => {
          if (err) {
            
            console.log(err.message);
            res.locals.user = null;  
            next();
          } else { 
            
            let user = await UserModel.findById(decodedToken.userId)
            res.locals.user = user._id
            
            
           
            next();
          }
        })
      } else {
        // console.log("done");
        res.locals.user = null;
        next()
      }
    }

const isUser = (req,res,next)=>{
  const token = req.cookies['access-token'];

  if(token){
    res.redirect('/')
  }else{
    next()
  }
}


const requireAdminAuth = (req,res,next) => {
  const token = req.cookies['admin-token'];

  if(token){
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) =>{
      if(err){
        console.log(err.message);
        res.redirect("/admin");
      }else{
        // console.log("authenticated");
        next();
      }
    })
  }else{
    res.redirect("/admin");
  }
};

const checkAdmin = (req,res,next) => {
  const token = req.cookies['admin-token'];
  
//check json web token exists and is verified
if (token) { 
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedToken) => {
    if (err) {
      
      console.log(err.message);
      res.locals.admin = null;  
      next();
    } else { 
      
      let admin = await adminModel.findById(decodedToken.adminId)
      res.locals.admin = admin._id
      next();
    }
  })
} else {
  res.locals.admin = null;
  next()
}
}






    module.exports = {
        requireAuth,
        checkUser,
        isUser,
        requireAdminAuth,
        checkAdmin
    }