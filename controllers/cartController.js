const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const bodyParser = require('body-parser');

const mongoose = require('mongoose')






const loadCart = async (req, res) => {
    try {
        const userId = res.locals.user;
        // console.log('helo',userId)
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


        // console.log('ghj',cartData[0].productz.productImage[0])

        res.render('cart', { cartData: cartData });
    } catch (error) {
        console.log(error.messsage);
    }
}


const cartAdd = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = res.locals.user;

        const isCartItem = await cartModel.findOne({ userId: userId, "products.productId": productId });

        // console.log(isCartItem);

        if (isCartItem) {
            const product = await productModel.findById(productId);
            if (product && product.stock > 0) {
                await cartModel.findOneAndUpdate({ userId: userId, 'products.productId': productId },
                    { $set: { 'products.$.quantity': 1 } },
                    { new: true }
                )
                res.redirect('/cart');
            } else {
                console.log('hwlooo')
            }


        } else {
            // console.log("here");
            const cart = await cartModel.updateOne({ userId },
                { $push: { products: { productId: new mongoose.Types.ObjectId(productId) } } },
                { upsert: true });
            // console.log("oool",cart);
            res.status(200).redirect('/cart');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const removeCart = async (req, res) => {
    try {
        const { productId } = req.params;
        // console.log(productId)
        const userId = res.locals.user;
        const out = await cartModel.findOneAndUpdate({ userId }, { $pull: { products: { productId } } }, { new: true });
        if (out) {
            res.redirect('/cart');
        }
    } catch (error) {
        console.log(error.message);
    }
}



const updateQuantity = async(req,res) => {
    try{

        const userId = res.locals.user;
        const{productId,increment}=req.body;     
        console.log(req.body)
        
        let product = await productModel.findById(productId)
        if(!product){
            return res.status(401).json({err:true,error: 'product not found'});
        }

        let updateCart = await cartModel.findOne({userId:userId})
        if(!updateCart){
            return res.status(401).json({err:true,error: 'cart not found'});
        }

        const updatedProducts = updateCart.products.find(products => products.productId.toString() === productId);
        if (!updatedProducts) {
            return res.status(401).json({ err:true,error: 'Product not found' });
        }

        // console.log('helloo',updatedProducts)

        if(increment==1){
            if((updatedProducts.quantity+1)>product.stock){
                return res.status(401).json({ err:true,error: 'stock exceed' });
    
            }
        }else{
            if((updatedProducts.quantity-1)<=0){
                return res.status(401).json({ err:true,error: 'minimum  quantity is 1' });
    
            }
        }

       
        const cartProducts = await cartModel.findOneAndUpdate(
            { userId: userId, 'products.productId': productId },
            { $inc: { 'products.$.quantity': increment } }, 
            { new: true } 
        );
            

       
       

        const price = await cartModel.aggregate([
            {
                $match:{userId:userId}
            },
            {
                $unwind:"$products"
            },
            {
                $lookup:{   
                    from:'products',
                    localField:'products.productId',
                    foreignField:'_id',
                    as:'productzz'
                }
            },
            {
                $unwind:"$productzz"
            },
            {
                $addFields: {
                    totalPrice: { $multiply: ["$products.quantity", "$productzz.price"] }
                }
            },
            {
                $group:{
                    _id:null,
                    subtotal:{$sum:"$totalPrice"}
                }
            }
        ])

        const Price = price[0].subtotal
       


        await updateCart.save();


        res.status(200).json({ cartProducts,Price,product, message: 'Cart updated successfully.' });

    }catch(error){
        console.log(error.message);
    }
}
    


module.exports = {
    loadCart,
    cartAdd,
    removeCart,
    updateQuantity
}