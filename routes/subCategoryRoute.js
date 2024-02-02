const express = require('express');

const {
    createSubCategory,
    getSubCategory,
    getSubCategories,
    updateSupCategory,
    deleteSupCategory,
    setCategoryIdToBody,
    createFilterObj,
} = require('../services/subCategoryService');

const {
    createSubCategoryValidator,
    getSubCategoryValidator,
    updateSubCategoryValidator,
    deleteSubCategoryValidator,
} = require("../utils/Validators/subCategoryValidator");

const authService = require('../services/authService');


// mergeParams: Allow us to access parameters on other routers
// ex: We need to access categoryId from category router
const router = express.Router({ mergeParams: true });

router
    .route('/')
    .post(
        authService.protect,
        authService.allowedTo('admin', 'manager'),
        setCategoryIdToBody,
        createSubCategoryValidator,
        createSubCategory
    )
    .get(createFilterObj, getSubCategories);
router
    .route('/:id')
    .get(getSubCategoryValidator, getSubCategory)
    .put(
        authService.protect,
        authService.allowedTo('admin', 'manager'),
        updateSubCategoryValidator,
        updateSupCategory
    )
    .delete(
        authService.protect,
        authService.allowedTo('admin'),
        deleteSubCategoryValidator,
        deleteSupCategory
    );

module.exports = router;