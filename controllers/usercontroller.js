const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');
const mailgen = require('mailgen');
require('dotenv').config();
const OtpModel = require('../models/otpModel');
const Productdb = require('../models/productModel');
const AddressModel = require('../models/addressModel');
const jwt = require('jsonwebtoken');
const productModel = require('../models/productModel');
const { findByIdAndUpdate } = require('../models/categoryModel');
const bodyParser = require('body-parser');
const addressModel = require('../models/addressModel');
const cartModel = require('../models/cartModel');
const categoryModel = require('../models/categoryModel');
const { default: mongoose } = require('mongoose');
const walletModel = require('../models/walletModel');




const welcome = async (req, res,next) => {

    try {
        console.log(res.locals.user);
        const products = await Productdb.find();
        console.log(products);
        res.render("index-asymmetric", { products });

    } catch (error) {
        next(error);
    }
}

const loadRegister = async (req, res,next) => {
    try {
        res.render('registration');
    } catch (error) {
        next(error);
    }
}

//otp
//decleared variable as global ,used to store user input data
let gname, gpassword, gemail, gmobile, otp;

//fun to generate random otp
const otpGenerator = () => {
    const generatedOtp = Math.random();
    const formattedOtp = parseInt(generatedOtp * 1000000);
    return formattedOtp;
};

//signup

const signUp = async (req, res,next) => {
    try {

        const { name, email, password, mobile } = req.body;
        gname = name;
        gemail = email;
        gpassword = password;
        gmobile = mobile;


        const existingUser = await UserModel.findOne({ email: gemail });

        if (existingUser) {
            return res.render("registration", { message: "Email already exists" });
        }

        otp = otpGenerator();
        console.log(otp, '-----------------------------------------------> OTP');
        sendOtp(gemail, otp);

        const newOtp = new OtpModel({
            email: gemail,
            otp: otp,
        });

        await newOtp.save();
        res.render("otp", { otp });

    } catch (error) {
        next(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//fun to send otp through email
function sendOtp(email, OTP) {
    let config = {
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    };

    const transport = nodemailer.createTransport(config);

    let MailGenerator = new mailgen({
        theme: "default",
        product: {
            name: "Mailgen",
            link: "http://mailgen.js/",
        },
    });

    let response = {
        body: {
            name: `${email}`,
            intro: `your OTP is ${otp}`,
            outro: "Looking forward",
        },
    };

    let mail = MailGenerator.generate(response);

    const message = {
        from: process.env.EMAIL,
        to: email,
        subject: "OTP sent successfully",
        html: mail,
    };

    transport.sendMail(message);
};

//resend otp



const resendOtp = async (req, res,next) => {
    try {
        otp = otpGenerator();
        console.log(otp);

        // Update the existing OTP record in the Otp collection with the new OTP and a new expiry time
        const updatedOtp = await OtpModel.findOneAndUpdate(
            { email: gemail },
            {
                otp: otp,
                expiry: new Date(Date.now() + 300000)
            },
            { new: true }
        );

        if (updatedOtp) {
            sendOtp(gemail, otp);
            res.render("otp", { otp: otp });
        } else {
            res.render("otp", { message: "Failed to update OTP. Please try again." });
        }
    } catch (error) {
        next(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//verifying otp and completing user registration

const verifyOtp = async (req, res,next) => {
    let userData
    const enteredOtp = req.body.otp;
    console.log(enteredOtp, 'entered otp');
    try {

        if (Number(enteredOtp) === otp) {
            const user = new UserModel({
                name: gname,
                email: gemail,
                password: gpassword,
                mobile: gmobile
            });

            console.log('user', user);

            userData = await user.save();
        }
        console.log(userData, 'userdata');
        if (userData) {
            function createTokens(userId) {
                const secretKey = process.env.ACCESS_TOKEN_SECRET;
                const expiresIn = '30d';
                const token = jwt.sign({ userId }, secretKey, { expiresIn });
                return token;
            }
            const token = createTokens(userData._id);
            // console.log("access token is: " + token);
            res.cookie("access-token", token, {
                maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
                httpOnly: true,
            });

            //create a wallet for the user
            const wallet = new walletModel({
                userId: userData._id,
                balance: 0,
                walletHistory: []
            });

            console.log("wallet coming",wallet);
            await wallet.save();

            res.redirect("/");
        } else {
            res.render("otp", { errorText: "Wrong OTP. Please try again." });

        }
    } catch (error) {
        next(error);
    }
};



const loadLogin = async (req, res,next) => {
    try {
        res.render('login');
    } catch (error) {
        next(error);
    }
};

const verifyLogin = async (req, res,next) => {

    try {
        const { email, password } = req.body;
        console.log(email);
        const userData = await UserModel.findOne({ email: email });

        if (userData) {

            if (password == userData.password) {
                // await UserModel.updateOne({ _id: userData._id }, { $set: { isOnline: true } });

                function createTokens(userId) {
                    const secretKey = process.env.ACCESS_TOKEN_SECRET;
                    const expiresIn = '30d';
                    const token = jwt.sign({ userId }, secretKey, { expiresIn });
                    return token;
                }
                const token = createTokens(userData._id);
                // console.log("access token is: " + token);
                res.cookie("access-token", token, {
                    maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days
                    httpOnly: true,
                });

                if (userData.is_blocked === false) {
                    res.redirect('/');
                }
                else {
                    res.render('login', { message: "You are blocked" });
                }


            } else {
                res.render('login', { message: "Invalid user" });
            }
        } else {
            res.render('login', { message: "Email and password are incorrect" });
        }
    } catch (error) {
        next(error);
        res.render('login', { message: "An error occurred" });
    }
};  

const logout = async (req, res,next) => {
    try {
        res.cookie("access-token", "", { maxAge: 1 });
        res.redirect('/')
    } catch (error) {
        next(error);
    }
};

      

const loadUserProduct = async (req, res,next) => {
    try {
        const { productId } = req.params;
        const product = await productModel.findOne({ _id: productId }).populate('offer').populate({path: "category", populate:{path:"offer"}})
        console.log("offer coming",product)
        res.render('product', { product, isStockAvailable: product.stock>0});
    } catch (error) {
        next(error);
    }
}

const LoadPersonalInfo = async (req, res,next) => {
    try {
        const user = await UserModel.findById(res.locals.user);
        res.render('account-personal-info', { user: user });
    } catch (error) {
        next(error);
    }
}

const editPersonalInfo = async (req, res,next) => {
    try {
        const { name, email, mobile } = req.body;
        console.log(name, email, mobile);
        const updateUser = await UserModel.findByIdAndUpdate(res.locals.user, { name, email, mobile }, { new: true });
        console.log(updateUser);
        res.render('account-personal-info', { user: updateUser });
    } catch (error) {
        next(error);
    }
};


const loadAddress = async (req, res,next) => {
    try {
        // const user
        const userId = res.locals.user;
        const addresssData = await AddressModel.findOne({ userId: userId });

        res.render('account-address', { addresssData: addresssData })
    } catch (error) {
        next(error);
    }
};



const loadAddAddress = async (req, res,next) => {
    try {
        const address = await AddressModel.find({})
        // console.log(address);
        res.render('account-address-add');
    } catch (error) {
        next(error);
    }
};


const addingAddress = async (req, res,next) => {
    try {

        const userId = res.locals.user;

        const { userName, mobileNumber, country, state, address, city, pincode } = req.body;
        console.log(req.body);
        const user = await AddressModel.findOne({ userId });
        // console.log('fggfdfgs')


        // If no existing address, it creates new address document and saves it to the db
        if (!user) {
            const newAddress = new AddressModel({
                userId,
                address: [
                    {
                        userName: userName,
                        mobileNumber: mobileNumber,
                        country: country,
                        state: state,
                        address: address,
                        city: city,
                        pincode: pincode,
                    }
                ]
            });
            await newAddress.save();
            // if yes it adds a new address object to the address array and saves the changes
        } else {
            user.address.push({
                userName: userName,
                mobileNumber: mobileNumber,
                country: country,
                state: state,
                address: address,
                city: city,
                pincode: pincode,
            });

            await user.save();
        }
        console.log("aaa", req.query.frompage)
        if (req.query.frompage && req.query.frompage === 'checkout') {
            console.log("query", req.query);
            res.redirect('/checkout')
        } else {
            console.log("no query");
            res.redirect('/account-address');
        }

    } catch (error) {
        next(error);
    }
}

const loadEditAddress = async (req, res,next) => {
    try {
        const { addressId } = req.params;
        // {"address.$":1} only  returnes the matched element from the address array
        // trued ojb in find qury
        const address = await AddressModel.findOne({ "address._id": addressId }, { "address.$": 1 })
        res.render('account-address-edit', { address });

    } catch (error) {
        next(error);
    }
}




const editingAddress = async (req, res,next) => {
    try {
        const { addressId } = req.params;
        const { userName, mobileNumber, country, state, address, city, pincode } = req.body;

        await AddressModel.updateOne({
            "address._id": addressId
        },
            {
                $set: {

                    "address.$.userName": userName,
                    "address.$.mobileNumber": mobileNumber,
                    "address.$.country": country,
                    "address.$.state": state,
                    "address.$.city": city,
                    "address.$.pincode": pincode,
                }
            })

        res.redirect("/account-address");

    } catch (error) {
        next(error);
    }

}

const removeAddress = async (req, res,next) => {
    try {
        const { addressId } = req.params;
        const updatedDocument = await AddressModel.findOneAndUpdate(
            { "address._id": addressId },
            { $pull: { address: { _id: addressId } } },
            { new: true }
        );
        if (updatedDocument) {
            res.redirect("/account-address");
        }
    } catch (error) {
        next(error);
    }
}

const loadCheckout = async (req, res,next) => {
    try {
        const userId = res.locals.user;
        const ckeckOutAddress = await addressModel.findOne({ userId: userId });

        const cartData = await cartModel.aggregate([{
            // filter
            $match: { userId: userId }
        },
        {
            // deconstructing the product array
            $unwind: "$products"
        },
        {
            $lookup: {
                from: 'products',
                localField: 'products.productId',
                foreignField: '_id',
                as: 'productz'
            }
        },
        {
            $unwind: "$productz"            
        },
        {
            $lookup: {
                from: 'offers',
                localField: 'productz.offer',
                foreignField: '_id',
                as: 'offerDetails'
            }
        } 
        ]);

        res.render('checkout', { ckeckOutAddress: ckeckOutAddress,cartData:cartData, razorpayKey:process.env.key_id})
        // console.log("helllllllllllooooooooo",ckeckOutAddress)
    } catch (error) {
        next(error);
    }
}

const loadProductlist = async (req, res,next) => {
    try {
        const productOffer = await productModel.find({}).populate('offer').populate({path: "category" , populate: {path: "offer"}})
        console.log("offer coming",productOffer)

        const category = req.query.category;
        const price = req.query.price;
        const filterObject = {}
        // console.log("category",category);
        // console.log("price",price);

            if(price){
                const prices = price.split('-');
                const minPrice = Number(prices[0].trim().substring(1));
                const maxPrice = Number(prices[1].trim().substring(1));

                filterObject.$and= [{price: {$gte: minPrice}},{price: {$lte: maxPrice}} ]
            }
            //filtering product baesd on category
            if(category){
                let categoryIds
                if(Array.isArray(category)) {
                    categoryIds = category.map(id => new mongoose.Types.ObjectId(id));
                } else {
                    categoryIds = [new mongoose.Types.ObjectId(category)];
                }
                console.log("categoryIds",categoryIds)  
                
                if(categoryIds.length>0){
                    filterObject.$or=[]
                    categoryIds.forEach(catId => {
                        const expersion = {category: catId};
                        filterObject.$or.push(expersion);
                    })
                }
    
            }

        const products = await Productdb.find(filterObject).populate('category');
        const cat = await categoryModel.find();
        
        res.render('productlist', { products: products,cat:cat ,productOffer});
    } catch (error) {
        next(error);
    }
} 

const loadOrderThankyou = async(req,res,next) =>{
    try{
        res.render('order-sucess') ;      
    }catch(error){
        next(error);
    }
}


const load404 = async(req,res,next) => {
    try{
        res.render('404')
    }catch(error){
        next(error);
    }
}

const walletLoad = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        console.log("user",userId)
        const wallet = await walletModel.findOne({userId:userId})
       
        res.render('wallet',{wallet});
    }catch(error){
        next(error);
    }
}

module.exports = {
    welcome,
    loadRegister,
    signUp,
    resendOtp,
    verifyOtp,
    loadLogin,
    verifyLogin,
    logout,
    loadUserProduct,
    LoadPersonalInfo,
    editPersonalInfo,
    loadAddress,
    loadAddAddress,
    addingAddress,
    loadEditAddress,
    editingAddress,
    removeAddress,
    loadCheckout,
    loadProductlist,
    loadOrderThankyou,
    load404,
    walletLoad,


}