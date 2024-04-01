const cartModel = require('../models/cartModel');
const productModel = require('../models/productModel');
const UserModel = require('../models/userModel');
const bodyParser = require('body-parser');

const mongoose = require('mongoose')






const loadCart = async (req, res,next) => {
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


        // console.log('ghj',cartData[0].productz.productImage[0])

        res.render('cart', { cartData: cartData });
    } catch (error) {
        next(error);
    }
}


const cartAdd = async (req, res,next) => {
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
            const cart = await cartModel.updateOne({ userId },    // "$each "operator is used to specify the array of elements to push
                { $push: { products:{ $each: [{ productId: new mongoose.Types.ObjectId(productId) }], $position: 0 } } },  //"$position:0" to insert new product at the beginning of the array
                { upsert: true });
            // console.log("oool",cart);
            res.status(200).redirect('/cart');
        }

    } catch (error) {
        next(error);
    }
}   

const removeCart = async (req, res,next) => {
    try {
        const { productId } = req.params;
        // console.log(productId)
        const userId = res.locals.user;
        const out = await cartModel.findOneAndUpdate({ userId }, { $pull: { products: { productId } } }, { new: true });
        if (out) {
            res.redirect('/cart');
        }
    } catch (error) {
        next(error);
    }
}



const updateQuantity = async(req,res,next) => {
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

        const Price = Number(cartData.reduce((total, product) => {
            if (product.offerDetails && product.offerDetails.length > 0) {
              return total += ((product.productz.price * product.products.quantity) - (product.productz.price * product.products.quantity * (product.offerDetails[0].percentage / 100))).toFixed(2);
            } else {
              return total += product.productz.price * product.products.quantity;
            }
          }, 0))
        

          console.log("price",Price)
        
        await updateCart.save();


        res.status(200).json({ cartProducts,Price,product, message: 'Cart updated successfully.' });

    }catch(error){
        next(error);
    }
}
    


module.exports = {
    loadCart,
    cartAdd,
    removeCart,
    updateQuantity
}