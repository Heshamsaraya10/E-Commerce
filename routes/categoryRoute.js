const express = require('express')
const {
    getCategoryValidator,
    createCategoryValidator,
    updateCategoryValidator,
    deleteCategoryValidator } = require("../utils/Validators/categoryValidator");

const
    {
        getCategoris,
        getCategory,
        createCategory,
        updateCategory,
        deleteCategory,
        uploadCategoryImage,
        resizeImage,
    } = require('../services/categoryService');

const authService = require('../services/authService');

const subcategoriesRoute = require("./subCategoryRoute");

const router = express.Router();

//Nested Route
router.use("/:categoryId/subcategories", subcategoriesRoute);

router
    .route('/')
    .get(getCategoris)
    .post(
        authService.protect,
        authService.allowedTo('admin', 'manager'),
        uploadCategoryImage,
        resizeImage,
        createCategoryValidator,
        createCategory
    );
router
    .route('/:id')
    .get(getCategoryValidator, getCategory)
    .put(
        authService.protect,
        authService.allowedTo('admin', 'manager'),
        uploadCategoryImage,
        resizeImage,
        updateCategoryValidator,
        updateCategory
    )
    .delete(
        authService.protect,
        authService.allowedTo('admin'),
        deleteCategoryValidator,
        deleteCategory,
    );

module.exports = router;

