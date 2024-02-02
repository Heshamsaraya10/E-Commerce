const asyncHandler = require("express-async-handler");
const ApiError = require('../utils/apiError');

const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");
const Cart = require("../models/cartModel");





const calcTotalCartPrice = (cart) => {
    let totalPrice = 0;
    cart.cartItems.forEach((item) => {
        totalPrice += item.quantity * item.price
    });
    cart.totalCartPrice = totalPrice;
    cart.totalPriceAfterDiscount = undefined;
    return totalPrice
}

//@dec    Add product to cart
//@route  GET /api/v1/cart
//@access private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
    const { productId, color } = req.body;
    const product = await Product.findById(productId);
    //1-Get cart for logged user
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        //create cart for logged user with product
        cart = await Cart.create({
            user: req.user._id,
            cartItems: [{ product: productId, color, price: product.price }]
        });
    } else {
        //product exest in cart,update product quantity
        const productIndex = cart.cartItems.findIndex(
            (item) => item.product.toString() === productId && item.color === color
        );
        if (productIndex > -1) {
            const cartItem = cart.cartItems[productIndex];
            cartItem.quantity += 1;

            cart.cartItems[productIndex] = cartItem;
        } else {
            //product not exest in cart, push product to cartItems array
            cart.cartItems.push({ product: productId, color, price: product.price })
        }
    }

    //Calc totla cart price
    calcTotalCartPrice(cart)
    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'product added to cart successfully',
        numOfCartItems: cart.cartItems.length,
        data: cart
    });
});

//@dec    GET logged user cart
//@route  GET /api/v1/cart
//@access private/User
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id })

    if (!cart) {
        return next(new ApiError(`There is no cart for this user id : ${req.user._id}`, 404));
    }
    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: cart
    })
});

//@dec    Remove specifc cart items
//@route  DELETE /api/v1/cart/:itemId
//@access private/User  
exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        {
            $pull: { cartItems: { _id: req.params.itemId } },
        },
        { new: true }
    );

    calcTotalCartPrice(cart);
    cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: cart
    })
});


//@dec    Clear logged user cart
//@route  DELETE /api/v1/cart
//@access private/User  
exports.claerCart = asyncHandler(async (req, res, next) => {

    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(204).send();
});

//@dec    Update specifc cart items quantity
//@route  PUT /api/v1/cart/:itemId
//@access private/User  
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        return next(new ApiError(`There is no cart for this user ${req.user._id}`, 404))
    }

    const itemIndex = cart.cartItems.findIndex(
        item => item._id.toString() === req.params.itemId
    );
    if (itemIndex > -1) {
        const cartItem = cart.cartItems[itemIndex];
        cartItem.quantity = quantity;
        cart.cartItems[itemIndex] = cartItem;
    } else {
        return next(new ApiError(`There is no item for this id :${req.params.itemId}`, 404))
    }

    calcTotalCartPrice(cart);

    await cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: cart
    })
});

//@dec    Apply coupon on logged user cart
//@route  PUT /api/v1/cart/applyCoupon
//@access private/User  
exports.applyCoupon = asyncHandler(async (req, res, next) => {
    //1-Get coupon based on coupon name
    const coupon = await Coupon.findOne({
        name: req.body.coupon,
        expire: { $gt: Date.now() },
    });

    if (!coupon) {
        return next(new ApiError(`Cupon is invalid or expire`))
    }
    //2-Get logged user cart to get total cart price
    const cart = await Cart.findOne({ user: req.user._id });

    const totalPrice = cart.totalCartPrice;

    //3-Calc price after descount

    const totalPriceAfterDiscount =
        (totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2);

    cart.totalPriceAfterDiscount = totalPriceAfterDiscount
    await cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: cart
    })
}); 