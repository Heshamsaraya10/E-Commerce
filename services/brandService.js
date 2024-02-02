const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require("express-async-handler")

const factory = require("./handlersFactory")
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Brand = require('../models/brandModel');



//upload single image
exports.uploadBrandImage = uploadSingleImage("image");

// image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer).
        resize(600, 600).
        toFormat("jpeg").
        jpeg({ quality: 90 })
        .toFile(`uploads/brands/${filename}`);

    //save image into our db
    req.body.image =  filename;
    next();
});

//@dec    GET list of brands
//@route  GET /api/v1/brands 
//@access public 
exports.getBrands = factory.getAll(Brand);

//@dec    Get specific brand by id
//@route  GET /api/v1/brands/:id
//@access puplic 
exports.getBrand = factory.getOne(Brand);

//@dec    Create brand
//@route  POST /api/v1/brands 
//@access private 
exports.createBrand = factory.createOne(Brand);

// @desc    Update specific brand
// @route   PUT /api/v1/brands/:id
// @access  Private
exports.updateBrand = factory.updateOne(Brand);

// @desc Delete brand
// @route   DELETE /api/v1/brands/:id
// @access  Private
exports.deleteBrand = factory.deleteOne(Brand);



