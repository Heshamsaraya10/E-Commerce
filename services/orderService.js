const stripe = require('stripe')(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const factory = require("./handlersFactory");
const ApiError = require('../utils/apiError');

const Product = require("../models/productModel");
const Order = require('../models/orderModel');
const Cart = require("../models/cartModel");


//@dec    Create cash order
//@route  POST /api/v1/orders/cartId
//@access Private/User 
exports.createCashOrder = asyncHandler(async (req, res, next) => {
    //App sitting
    const shippingPrice = 0;
    const taxPrice = 0;

    //1-Get cart depend on cartId
    const cart = await Cart.findById(req.params.cartId);
    if (!cart) {
        return next(new ApiError(`There is no cart this whith id ${req.body._id}`, 404));
    }

    //2-Get order price depend on cart price "check if coupon apply"
    const cartPrice =
        cart.totalPriceAfterDiscount
            ? cart.totalPriceAfterDiscount
            : cart.totalCartPrice;

    const totalOrderPrice = cartPrice + taxPrice + shippingPrice

    //3-Create order with default paymentMethodType cash
    const order = await Order.create({
        user: req.user._id,
        cartItems: cart.cartItems,
        shippingAddress: req.body.shippingAddress,
        totalOrderPrice,

    })
    //4-After creating order , decrement product quantity , increment product sold

    if (order) {
        const bulkOption = cart.cartItems.map(item => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
            }
        }));
        await Product.bulkWrite(bulkOption, {});

        //5-Clear cart depend on cartId
        await Cart.findByIdAndDelete(req.params.cartId);
    }

    res.status(201).json({ status: 'success', data: order });
});


exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
    if (req.user.role === 'user') req.filterObj = { user: req.user._id };
    next();
}
);

//@dec    Get all orders
//@route  GET /api/v1/orders
//@access Private/Admin-User-Manager
exports.findAllOrders = factory.getAll(Order);


//@dec    Get spesific order
//@route  GET /api/v1/orders
//@access Private/Admin-User-Manager
exports.findSpesificOrders = factory.getOne(Order);


//@dec      Update order paid status to paied
//@route    PUT /api/v1/orders/:id/pay
//@access   Private/Admin-Manager
exports.updateOrderToPaied = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ApiError(`There is no such a order with thes id : ${req.params.id}`, 404));
    }

    //update order to paied
    order.isPaid = true;
    order.paidAt = Date.now();

    const updatedOrder = await order.save()

    res.status(200).json({ status: "Success", data: updatedOrder })
});


//@dec      Update order delivered status 
//@route    PUT /api/v1/orders/:id/deliver
//@access   Private/Admin-Manager
exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ApiError(`There is no such a order with thes id : ${req.params.id}`, 404));
    }

    //update order to paied
    order.isDleivered = true;
    order.dleiveredAt = Date.now();

    const updatedOrder = await order.save()

    res.status(200).json({ status: "Success", data: updatedOrder })
});


//@dec      Get checkout session from stripe and send it as a response
//@route    GET /api/v1/orders/checkout-session/cartId
//@access   Private/User
exports.checkoutSession = asyncHandler(async (req, res, next) => {
    // app settings
    const taxPrice = 0;
    const shippingPrice = 0;

    // 1) Get cart depend on cartId
    const cart = await Cart.findById(req.params.cartId);
    if (!cart) {
        return next(
            new ApiError(`There is no such cart with id ${req.params.cartId}`, 404)
        );
    }

    // 2) Get order price depend on cart price "Check if coupon apply"
    const cartPrice = cart.totalPriceAfterDiscount
        ? cart.totalPriceAfterDiscount
        : cart.totalCartPrice;

    const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

    // 3) Create stripe checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: req.user.name,
                    },
                    unit_amount: totalOrderPrice * 100
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/orders`,
        cancel_url: `${req.protocol}://${req.get('host')}/cart`,
        customer_email: req.user.email,
        client_reference_id: req.params.cartId,
        metadata: req.body.shippingAddress,
    });

    // 4) send session to response
    res.status(200).json({ status: 'success', session });
});