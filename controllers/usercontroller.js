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
const cartModel = require('../models/cartModel')




const welcome = async (req, res) => {

    try {
        console.log(res.locals.user);
        const products = await Productdb.find();
        console.log(products);
        res.render("index-asymmetric", { products });

    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('registration');
    } catch (error) {
        console.log(error.message);
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

const signUp = async (req, res) => {
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
        console.log(error);
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



const resendOtp = async (req, res) => {
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
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

//verifying otp and completing user registration

const verifyOtp = async (req, res) => {
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
            res.redirect("/");
        } else {
            res.render("otp", { errorText: "Wrong OTP. Please try again." });

        }
    } catch (error) {
        console.log(error.message);
    }
};



const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
};

const verifyLogin = async (req, res) => {

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
        console.log(error.message);
        res.render('login', { message: "An error occurred" });
    }
};

const logout = async (req, res) => {
    try {
        res.cookie("access-token", "", { maxAge: 1 });
        res.redirect('/')
    } catch (error) {
        console.log(error.message);
    }
};

const loadProductlist = async (req, res) => {
    try {
        const products = await Productdb.find();
        res.render('productlist', { products: products });
    } catch {
        console.log(error.message);
    }
}

const loadUserProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await productModel.findOne({ _id: productId })
        res.render('product', { product });
    } catch (error) {
        console.log(error.message);
    }
}

const LoadPersonalInfo = async (req, res) => {
    try {
        const user = await UserModel.findById(res.locals.user);
        res.render('account-personal-info', { user: user });
    } catch (error) {
        console.log(error.message);
    }
}

const editPersonalInfo = async (req, res) => {
    try {
        const { name, email, mobile } = req.body;
        console.log(name, email, mobile);
        const updateUser = await UserModel.findByIdAndUpdate(res.locals.user, { name, email, mobile }, { new: true });
        console.log(updateUser);
        res.render('account-personal-info', { user: updateUser });
    } catch (error) {
        console.log(error.message);
    }
};


const loadAddress = async (req, res) => {
    try {
        // const user
        const userId = res.locals.user;
        const addresssData = await AddressModel.findOne({ userId: userId });

        res.render('account-address', { addresssData: addresssData })
    } catch (error) {
        console.log(error.message);
    }
};



const loadAddAddress = async (req, res) => {
    try {
        const address = await AddressModel.find({})
        // console.log(address);
        res.render('account-address-add');
    } catch (error) {
        console.log(error.message);
    }
};


const addingAddress = async (req, res) => {
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
        console.log(error.message);
    }
}

const loadEditAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        // {"address.$":1} only  returnes the matched element from the address array
        // trued ojb in find qury
        const address = await AddressModel.findOne({ "address._id": addressId }, { "address.$": 1 })
        res.render('account-address-edit', { address });

    } catch (error) {
        console.log(error);
    }
}




const editingAddress = async (req, res) => {
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
        console.log(error.message);
    }

}

const removeAddress = async (req, res) => {
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
        console.log(error.message);
    }
}

const loadCheckout = async (req, res) => {
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
        }
        ]);

        res.render('checkout', { ckeckOutAddress: ckeckOutAddress,cartData:cartData })
        // console.log("helllllllllllooooooooo",ckeckOutAddress)
    } catch (error) {
        console.log(error.message);
    }
}

const productFilter = async(req,res) =>{
    try{
        const { category } = req.query;
        
        const filteredProducts = await productModel.find({ category });
    
        res.render({filteredProducts,message:'done'})
    }catch(error){
        console.log(error.message);
    }
}


const load404 = async(req,res) => {
    try{
        res.render('404')
    }catch(error){
        console.log(error.message);
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
    loadProductlist,
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
    productFilter,
    load404

}