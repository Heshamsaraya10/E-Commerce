const factory = require("./handlersFactory")
const SubCategory = require('../models/subCategoryModel');

exports.setCategoryIdToBody = (req, res, next) => {
    //Nested route (creat)
    if (!req.body.category) req.body.category = req.params.categoryId
    next();
}

//Nested Route
//Get /api/v1/categories/:categoryId/subcategories
exports.createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (req.params.categoryId) filterObject = { category: req.params.categoryId };
    req.filterObj = filterObject;
    next();
};


// @desc    Get list of subcategories
// @route   GET /api/v1/subcategories
// @access  Public
exports.getSubCategories = factory.getAll(SubCategory);

// @desc    Get specific subcategory by id
// @route   GET /api/v1/subcategories/:id
// @access  Public
exports.getSubCategory = factory.getOne(SubCategory);

// @desc    Create subCategory
// @route   POST  /api/v1/subcategories
// @access  Private
exports.createSubCategory = factory.createOne(SubCategory);

// @desc    Update specific supcategory
// @route   PUT /api/v1/supcategories/:id
// @access  Private
exports.updateSupCategory = factory.updateOne(SubCategory);


// @desc Delete subcategory
// @route   DELETE /api/v1/subcategories/:id
// @access  Private
exports.deleteSupCategory = factory.deleteOne(SubCategory);
