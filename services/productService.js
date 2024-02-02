const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require("express-async-handler")

const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware")
const factory = require("./handlersFactory")
const Product = require("../models/productModel")

exports.uploadProductImages = uploadMixOfImages([
    {
        name: 'imageCover',
        maxCount: 1,
    },
    {
        name: 'images',
        maxCount: 5,
    },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
    // console.log(req.files)
    //1- image processing for imageCover
    if (req.files.imageCover) {
        const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/products/${imageCoverFileName}`);

        // Save image into our db
        req.body.imageCover = imageCoverFileName;
    }
    //2- image processing for images
    if (req.files.images) {
        req.body.images = [];
        await Promise.all(req.files.images.map(async (img, index) => {
            const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

            await sharp(img.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 95 })
                .toFile(`uploads/products/${imageName}`);

            // Save image into our db
            req.body.images.push(imageName);
        })
        );
        next();
    }

});


//@dec    GET list of products
//@route  GET /api/v1/products 
//@access public 
exports.getProducts = factory.getAll(Product, "Products");

//@dec    Get specific product by id
//@route  GET /api/v1/products/:id
//@access puplic 
exports.getProduct = factory.getOne(Product, 'reviews');

//@dec    Create product
//@route  POST /api/v1/products 
//@access private 
exports.createProduct = factory.createOne(Product);

// @desc    Update specific product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = factory.updateOne(Product);

// @desc Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = factory.deleteOne(Product);
