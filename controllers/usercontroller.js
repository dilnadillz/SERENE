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
const couponModel = require('../models/couponModel');
const referralModel = require('../models/referralModel');
const shortid = require('shortid');
const Razorpay = require('razorpay');

    


const welcome = async (req, res,next) => {

    try {
        console.log(res.locals.user);
        const products = await Productdb.find();
        // console.log(products);
        res.render("index-asymmetric", { products });

    } catch (error) {
        next(error);
    }
}

const loadRegister = async (req, res,next) => {
    try {
        if(req.cookies['access-token']){
            res.redirect("/");
        }else{
            let referralId = req.query.referralId;
            console.log("referralid",referralId)
            res.render('registration',{referralId});
        }
       
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
        
        console.log("Referralid in qury", req.query.referralId)

        if (req.query && req.query.referralId) {
            req.session.referralId = req.query.referralId;
        }
        
        console.log("Register session: ", req.session.referralId)
        
      
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
                mobile: gmobile,
                referralCode: shortid.generate()
            });

            console.log('user', user);

            userData = await user.save();
        }
        // console.log(userData, 'userdata');
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
            //chking referral id in session
            if(req.session.referralId){
                const referralId = req.session.referralId;
                // console.log("refreeeeee", referralId);
                const referralUser = await UserModel.findOne({referralCode:referralId});//data of referal user
                const signedUser = await UserModel.findById(userData._id);//data of signed user
                // console.log("referralUser",referralUser);
                console.log("signedUser",signedUser);

                //chking referral user is there
                if(referralUser){
                    const referralOffer = await referralModel.findOne();//finding the referral offer
                    console.log("referralOffer",referralOffer);

                    //chking referral offer exist
                    if(referralOffer){
                        const referralUserWallet = await walletModel.findOne({userId:referralUser._id});//retrving the wallet of referraluser
                        console.log("referralUserWallet",referralUserWallet);
                        const signedUserWallet = await walletModel.findOne({userId:userData._id});//retrvng the wallet of signed user
                        console.log("signedUserWallet",signedUserWallet);
    
                        if(referralUserWallet){//if wallet exist adding referral reward in reffered user wallet
                            referralUserWallet.balance += referralOffer.referrerReward,
                            referralUserWallet.walletHistory.push({
                                date: new Date(),
                                amount: referralOffer.referrerReward,
                                status: 'Credited (Referral Reward)'
                            })

                            await referralUserWallet.save();

                            if(signedUserWallet){//if signed user wallet exist here ading refreebonus to the wallet
                                signedUserWallet.balance += referralOffer.referreeBonus,
                                signedUserWallet.walletHistory.push({
                                    date: new Date(),
                                    amount: referralOffer.referreeBonus,
                                    status: 'Credited (Signup Reward)'
                                })
                                await signedUserWallet.save();
                            }
                        }
                    }
                
                }
            }
            

       

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


const loadForgotPassword = async(req,res,next) => {
    try{
        res.render("forgotPassword");
    }catch(error){
        next(error);
    }
}

const forgotPasswordOtp = async (req,res,next) => {
    try{
        globalEmail =req.body.email;
        console.log("globalEmail",globalEmail)
        const userData = await UserModel.findOne({email:globalEmail});
        console.log("userdata",userData);
        if(userData){
            otp = otpGenerator();
            console.log(otp) 
            sendOtp(globalEmail, otp);

            res.render("forgotPasswordOtp")
        }else{
            res.render("forgotPassword",{message: "no user found"});
        }
    }catch(error){
        next(error);
    }
}

const verifyForgotPassword = async(req,res,next) => {
    try{
        const {otp} = req.body;
        console.log(otp)
        if(otp === String(otp)){
            res.render("setNewPassword")
        }else {
            res.render("forgotPasswordOtp",{message:"wrong otp"});
        }
    }catch(error){
        next(error);
    }
}

const newPassword = async(req,res,next) => {
    try{
        const {newPassword} = req.body;
        const {confirmPassword} = req.body;
        console.log("newPassword",newPassword);
        console.log("conformPassword",confirmPassword);

        //hash the new password before storing
        const passwordHash = await bcrypt.hash(newPassword, 10);
        console.log("passwordHash",passwordHash);
        
        //comparing plaintext newpasssword with hashedconfrm pswd
        const matchingPassword = await bcrypt.compare(newPassword,passwordHash);
        console.log("matchingPassword",matchingPassword);

        if(matchingPassword){
            await UserModel.findOneAndUpdate({email: globalEmail},{$set:{password:passwordHash}})
            res.redirect("/login")
        }else{
            res.render("newPassword",{message:"password not matching"});
        }

       
    }catch(error){
        next(error);
    }
}


      

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

        const coupon = await couponModel.find({})
        console.log("cpoupon",coupon);  
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
         // Calculate totalAmount here
         let totalAmount = 0;
         cartData.forEach((item) => {
             totalAmount += item.products.quantity * item.productz.price;
         });

        console.log("cartdata",cartData)
        res.render('checkout', { ckeckOutAddress: ckeckOutAddress,cartData:cartData, razorpayKey:process.env.key_id,coupon,totalAmount: totalAmount})
        // console.log("helllllllllllooooooooo",ckeckOutAddress)
    } catch (error) {
        next(error);
    }
}

const loadProductlist = async (req, res, next) => {
    try {
        const productOffer = await productModel.find({}).populate('offer').populate({ path: "category", populate: { path: "offer" } })
        console.log("offer coming", productOffer)

        const category = req.query.category;

        const filterObject = {}

        if (category) {
            let categoryIds
            if (Array.isArray(category)) {
                categoryIds = category.map(id => new mongoose.Types.ObjectId(id));
            } else {
                categoryIds = [new mongoose.Types.ObjectId(category)];
            }
            console.log("categoryIds", categoryIds)

            if (categoryIds.length > 0) {
                filterObject.$or = []
                categoryIds.forEach(catId => {
                    const expersion = { category: catId };
                    filterObject.$or.push(expersion);
                })
            }

        }

        const products = await Productdb.find(filterObject).populate('category');
        const cat = await categoryModel.find();

        res.render('productlist', { products: products, cat: cat, productOffer });
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




const walletLoad = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        console.log("user",userId)
        const razorpayKey = process.env.key_id
        const wallet = await walletModel.findOne({userId:userId})
       
        res.render('wallet',{wallet,razorpayKey:razorpayKey});
    }catch(error){
        next(error);
    }
}
const instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});
const addAmountWallet = async(req,res,next) => {
    try{
        const {amount} = req.body;
        console.log("amount",amount)

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: 'orderId'
        };
        
        console.log("options",options)

        const response = await instance.orders.create(options);
        console.log("response",response)
        res.json(response)

    }catch(error){
        next(error);
    }
} 
const addAmount = async(req,res,next) =>{
    try{
        const userId = res.locals.user;
        const {amount} = req.body;
        console.log("amountz",amount)
        console.log("userId",userId)

        if(!userId) {
            return res.status(400).json({sucess: false,message: "user not found"});
        }

        const wallet = await walletModel.findOne({userId:userId});
        console.log("wallet",wallet);

        wallet.balance += parseInt(amount);
        console.log("wallet.balance",wallet.balance)

        const transcations = {
            date: new Date(),
            amount: amount,
            status: 'Credited (From Bank)'
        }
        //here pusing transcations object to the wallethistory array
        wallet.walletHistory.push(transcations);

        await wallet.save();

       
        res.json({sucess:true});
       
            
    }catch(error){
        next(error);
    }
}

const loadWalletHistory = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        const wallet = await walletModel.findOne({userId:userId})
        wallet.walletHistory.sort((a, b) => b.date - a.date);
        res.render('walletHistory',{wallet});
    }catch(error){
        next(error);
    }
}

const applyCoupon = async(req,res,next) => {
    try{
        const userId = res.locals.user;
        const {couponCode} = req.body;

        const cart =  await cartModel.findOne({userId:userId}).populate("products.productId");
        if(!cart){
            return res.status(401).json({message:"cart not found for user"});
        }
        console.log("cart",cart);

        const totalBeforeDiscount = Number(cart.products.reduce((total, product) => {
            return total + (product.productId.price * product.quantity);
        }, 0).toFixed(2));
        
        console.log("totals", totalBeforeDiscount);
        
        
        const coupon = await couponModel.findOne({couponCode:couponCode});
      
        if(!coupon){
            return res.status(401).json({message:"invalid coupon code"});
        }
        console.log("couponzz",coupon);
        if(new Date() < coupon.startingDate || new Date() > coupon.expiryDate){
            return res.status(401).json({message:"coupon is not valid on this date"});
        }
       
        if(totalBeforeDiscount < coupon.minimumAmount){
            return res.status(401).json({message:`coupon is valid above ${coupon.minimumAmount}`});
        }
        console.log("coupon",coupon);

        const totalDiscount = Math.min(coupon.discount, totalBeforeDiscount);
        const totalAfterDiscount = totalBeforeDiscount - totalDiscount;
        console.log("finaltotal",totalAfterDiscount)
        console.log("totalDiscount",totalDiscount)

        cart.couponApplied = couponCode;
        cart.discount = totalDiscount;  
        await cart.save();      

        res.status(200).json({success: true, message: "coupon applied", totals:totalAfterDiscount, discount:coupon.discount});

    }catch(error){
        next(error);
    }
}

const removeCoupon = async(req,res,next) => {
    try{
        const userId = res.locals.user;

        const cart = await cartModel.findOne({userId:userId}).populate("products.productId");
        if(!cart){
            return res.status(401).json({message:"cart not found for user"});
        }
       console.log("cart",cart);
        //checking if coupon applied before
        if(!cart.couponApplied){
            return res.status(401).json({message:"coupon not applied"})
        }

        //remove coupon from cart
        cart.couponApplied = null;

        await cart.save();
       
        
        // Calculate the total amount after removing the coupon
        const totalAfterRemoval = Number(cart.products.reduce((total, product) => {
            return total + (product.productId.price * product.quantity);
        }, 0).toFixed(2));
        console.log("dffg",totalAfterRemoval)
      
        res.status(200).json({sucess:true, message:"coupon removed",totalAmount: totalAfterRemoval})

    }catch(error){
        next(error);
    }
}

const loadUserReferral = async(req,res,next) => {
    try{
        const userId = res.locals.user;

        const user = await UserModel.findById(userId);
        const referralCode = user.referralCode
        console.log("user",referralCode);
        res.render('userReferral',{referralCode});
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
    loadForgotPassword,
    forgotPasswordOtp,
    verifyForgotPassword,
    newPassword,
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
    walletLoad,
    addAmountWallet,
    addAmount,
    loadWalletHistory,
    applyCoupon,
    removeCoupon,
    loadUserReferral,
  


}