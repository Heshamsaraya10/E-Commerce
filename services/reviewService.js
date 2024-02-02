const factory = require("./handlersFactory")
const Review = require('../models/reviewModel');




//Nested Route
//Get /api/v1/products/:productId/reviews
exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (req.params.productId) filterObject = { product: req.params.productId };
    req.filterObj = filterObject;
    next();
};


//@dec    GET list of reviews
//@route  GET /api/v1/reviews 
//@access public 
exports.getReviews = factory.getAll(Review);

//@dec    Get specific review by id
//@route  GET /api/v1/reviews/:id
//@access puplic 
exports.getReview = factory.getOne(Review);


exports.setProductIdAndUserIdToBody = (req, res, next) => {
    //Nested route (creat)
    if (!req.body.product) req.body.product = req.params.productId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
}

//@dec    Create review
//@route  POST /api/v1/reviews 
//@access private/protect/User
exports.createReview = factory.createOne(Review);

// @desc    Update specific review
// @route   PUT /api/v1/reviews/:id
// @access  Private/protect/User
exports.updateReview = factory.updateOne(Review);

// @desc Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/protect/User-Admin-Manager
exports.deleteReview = factory.deleteOne(Review);



