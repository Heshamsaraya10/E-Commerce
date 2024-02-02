const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require("express-async-handler")

const factory = require("./handlersFactory")
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Category = require('../models/categoryModel');


//upload single image
exports.uploadCategoryImage = uploadSingleImage("image");

// image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    const filename = `categroy-${uuidv4()}-${Date.now()}.jpeg`;

    if (req.file) {
        await sharp(req.file.buffer).
            resize(600, 600).
            toFormat("jpeg").
            jpeg({ quality: 90 })
            .toFile(`uploads/categories/${filename}`);

        //save image into our db
        req.body.image = filename;
    }
    next();
});


//@dec    GET list of categories
//@route  GET /api/v1/categories 
//@access public 
exports.getCategoris = factory.getAll(Category);

//@dec    Get specific category by id
//@route  GET /api/v1/categories/:id
//@access puplic 
exports.getCategory = factory.getOne(Category);


//@dec    Create category
//@route  POST /api/v1/categories 
//@access private/Admin-Manager 
exports.createCategory = factory.createOne(Category);


// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin-Manager  
exports.updateCategory = factory.updateOne(Category);


// @desc Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin 
exports.deleteCategory = factory.deleteOne(Category);
