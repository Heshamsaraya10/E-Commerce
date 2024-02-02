const mongoose = require('mongoose')
const product = require("./productModel")

//1-creat schema
const reviewSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    ratings: {
        type: Number,
        min: [1, 'Min rating value is 1.0'],
        max: [5, 'Max rating value is 5.0'],
        required: [true, 'Review ratings required'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "Review must belong to user"]
    },
    //parent referance 
    product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: [true, "Review must belong to product"]
    }
},
    { timestamps: true });

reviewSchema.pre(/^find/, function (next) {
    this.populate({ path: "user", select: "name" })
    next();
});

reviewSchema.statics.calcAverageRatingsAndQuantity = async function (productId) {
    const result = await this.aggregate([
        // Stage 1: Get all reviews in specific product
        {
            $match: { product: productId }
        },
        // Stage 2: Grouping reviews based on productId and calc avgratings , ratingsquantity
        {
            $group: {
                _id: 'product',
                avgRatings: { $avg: "$ratings" },
                ratingsQuantity: { $sum: 1 }
            }
        },
    ]);
    if (result.length > 0) {
        await product.findByIdAndUpdate(productId, {
            ratingsAverage: result[0].avgRatings,
            ratingsQuantity: result[0].ratingsQuantity
        })
    } else {
        await product.findByIdAndUpdate(productId, {
            ratingsAverage: 0,
            ratingsQuantity: 0,
        })
    }
};
reviewSchema.post("save", async function () {
    await this.constructor.calcAverageRatingsAndQuantity(this.product)
});

reviewSchema.post('deleteOne', async function () {
    await this.constructor.calcAverageRatingsAndQuantity(this.product);
});

//2-creat model
module.exports = mongoose.model("Review", reviewSchema)
