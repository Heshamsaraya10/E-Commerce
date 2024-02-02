const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const asyncHandler = require("express-async-handler");
const ApiError = require('../utils/apiError');
const sendEmail = require("../utils/sendEmail");
const creatToken = require("../utils/createToken");
const { sanitizeUser } = require("../utils/sanitizeData");


const User = require("../models/userModel");



//@dec    Signup
//@route  GET /api/v1/auth/signup 
//@access public 
exports.signup = asyncHandler(async (req, res, next) => {
    // 1-creat user
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        // phone: req.body.phone
    })
    //2- jwt
    const token = creatToken(user._id);

    res.status(201).json({ data: sanitizeUser(user), token })
});


//@dec    Login
//@route  GET /api/v1/auth/login 
//@access public 
exports.login = asyncHandler(async (req, res, next) => {
    //1- check if password and email in the body
    //2- check if user exist & check if password is correct
    const user = await User.findOne({ email: req.body.email })

    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
        return next(new ApiError("Incorrect email or password", 401));
    }
    //3-jwt 
    const token = creatToken(user._id);
    //4-send response to client side
    res.status(200).json({ data: user, token })
});


// @desc   make sure the user is logged in
exports.protect = asyncHandler(async (req, res, next) => {
    // 1) Check if token exist, if exist get
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(
            new ApiError(
                'You are not login, Please login to get access this route',
                401
            )
        );
    }

    // 2) Verify token (no change happens, expired token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3) Check if user exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
        return next(
            new ApiError(
                'The user that belong to this token does no longer exist',
                401
            )
        );
    }

    // 4) Check if user change his password after token created
    if (currentUser.passwordChangedAt) {
        const passChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000,
            10
        );
        // Password changed after token created (Error)
        if (passChangedTimestamp > decoded.iat) {
            return next(
                new ApiError(
                    'User recently changed his password. please login again..',
                    401
                )
            );
        }
    }

    req.user = currentUser;
    next();
});

// @desc Authorization (user permissions)
// ["admin", "manager"]
exports.allowedTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        // 1) access roles
        // 2) access registered user (req.user.role)
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError('You are not allowed to access this route', 403)
            );
        }
        next();
    });


//@dec    Forgot password
//@route  POST /api/v1/auth/forgotPassword
//@access public 
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    //1)) Get user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ApiError(`There is no user with that email ${req.body.email}`), 404);
    }

    //2)) if user exists, Generate hash reset random 6  digits and save it in db
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');
    // save hashed password reset code into db
    user.passwordResetCode = hashedResetCode;
    //add expiretions time for password reset code (10min) 
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    user.passwordResetVerified = false;

    await user.save();


    const message = `Hi ${user.name}, \n we received a request to reset the password on your E-shop account. \n ${resetCode} \n Enter this code to complete  the reset \n Thanks for helping us keep your account secure. \n the E-shop team.`

    //3)) send  the reset code via email
    try {
        await sendEmail({
            email: user.email,
            subject: 'Yor password recet code (valid for 10 min)',
            message
        })
    } catch (err) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;

        await user.save();
        return next(new ApiError("There is an error in sending email", 500))
    }

    res
        .status(200)
        .json({ status: "Success", message: "Reset code sent to email" });
});


//@dec    Verify password reset code 
//@route  POST /api/v1/auth/verifyResetCode
//@access public 
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
    // 1)) Get user based on reset code
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(req.body.resetCode)
        .digest('hex');

    const user = await User.findOne({
        passwordResetCode: hashedResetCode,
        passwordResetExpires: { $gt: Date.now() },
    })
    if (!user) {
        return next(new ApiError('Reset Code invalid or expired'));
    }

    // 2)) Reset code valid
    user.passwordResetVerified = true;
    await user.save();

    res.status(200).json({
        status: 'Success'
    });
});


//@dec    Reset Password
//@route  POST /api/v1/auth/resetPassword
//@access public 
exports.resetPassword = asyncHandler(async (req, res, next) => {
    //1- get user based on email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new ApiError(`There is no user with email ${req.body.email}`, 404));
    }


    //2- check if reset code verified
    if (!user.passwordResetVerified) {
        return next(new ApiError("Reset code not verifyed", 400))
    }

    user.password = req.body.newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();

    //3- JWT 
    const token = creatToken(user._id);
    res.status(200).json({ token });
});