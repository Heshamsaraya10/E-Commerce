const express = require('express');

const {
    addProductToCart,
    getLoggedUserCart,
    removeSpecificCartItem,
    claerCart,
    updateCartItemQuantity,
    applyCoupon
} = require('../services/cartService');

const authService = require('../services/authService');

const router = express.Router();
router.use(authService.protect, authService.allowedTo('user'));

router
    .route('/')
    .post(addProductToCart)
    .get(getLoggedUserCart)
    .delete(claerCart);

router.put("/applyCoupon", applyCoupon)

router
    .route('/:itemId')
    .put(updateCartItemQuantity)
    .delete(removeSpecificCartItem);

module.exports = router;

