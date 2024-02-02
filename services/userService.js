const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require("express-async-handler")
const bcrypt = require("bcrypt")

const factory = require("./handlersFactory")
const ApiError = require('../utils/apiError')
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const creatToken = require("../utils/createToken");
const User = require('../models/userModel');



//upload single image
exports.uploadUserImage = uploadSingleImage("profileImg");

// image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

    if (req.file) {
        await sharp(req.file.buffer).
            resize(600, 600).
            toFormat("jpeg").
            jpeg({ quality: 90 })
            .toFile(`uploads/users/${filename}`);

        //save image into our db
        req.body.profileImg = filename;
    }

    next();
});

//@dec    GET list of users
//@route  GET /api/v1/users 
//@access Private/admin 
exports.getUsers = factory.getAll(User);

//@dec    Get specific user by id
//@route  GET /api/v1/users/:id
//@access Private/admin  
exports.getUser = factory.getOne(User);

//@dec    Create user
//@route  POST /api/v1/users 
//@access private/admin  
exports.createUser = factory.createOne(User);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/admin 
exports.updateUser = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name,
            slug: req.body.slug,
            phone: req.body.phone,
            email: req.body.email,
            profileImg: req.body.profileImg,
            role: req.body.role,


        },
        {
            new: true,
        });

    if (!document) {
        return next(
            new ApiError(`No document for this id ${req.params.id}`, 404)
        );
    }
    res.status(200).json({ data: document });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndUpdate(req.params.id,
        {
            password: await bcrypt.hash(req.body.password, 12),
            passwordChangedAt: Date.now(),
        },
        {
            new: true,
        });

    if (!document) {
        return next(
            new ApiError(`No document for this id ${req.params.id}`, 404)
        );
    }
    res.status(200).json({ data: document });
});

// @desc Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/admin 
exports.deleteUser = factory.deleteOne(User);


//@dec    Get Logged user data
//@route  GET /api/v1/users/getMe
//@access Private/protect  
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
    req.params.id = req.user._id
    next();
});

//@dec    Update Logged user password
//@route  PUT /api/v1/users/updateMyPassword
//@access Private/protect  
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
    // 2 Update user password based user payload (req.user._id)
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            password: await bcrypt.hash(req.body.password, 12),
            passwordChangedAt: Date.now(),
        },
        {
            new: true,
        });
    // 2-JWT
    const token = creatToken(user._id);

    res.status(200).json({ data: user, token });
});

//@dec    Update Logged user Data (without password,role)
//@route  PUT /api/v1/users/updateMe
//@access Private/protect  
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user._id,
        {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
        },
        { new: true }
    );
    res.status(200).json({ data: updatedUser });
});

//@dec    Deactivate Logged user 
//@route  DELETE /api/v1/users/deleteMe
//@access Private/protect  
exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false })

    res.status(204).json({ status: "Success" });
});
