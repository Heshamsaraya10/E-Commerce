const mongoose = require('mongoose')
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Name required"]
    },
    slug: {
        type: String,
        lowercase: true,
    },
    email: {
        type: String,
        required: [true, "Email required"],
        unique: true,
        lowercase: true,
    },
    phone: String,
    profileImg: String,

    password: {
        type: String,
        required: [true, "Password required"],
        minLength: [6, "too short password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
        type: String,
        enum: ['user', "admin", "manager"],
        default: 'user',
    },
    active: {
        type: Boolean,
        default: true,
    },
    //child referance
    wishlist: [{
        type: mongoose.Schema.ObjectId,
        ref: "Product",
    }],
    addresses: [
        {
            id: { type: mongoose.Schema.Types.ObjectId },
            alias: String,
            details: String,
            phone: String,
            city: String,
            postalCode: String,

        }
    ]
}, { timestamps: true })

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    //Hshing user password
    this.password = await bcrypt.hash(this.password, 12);
    next();
})

const User = mongoose.model('User', userSchema)
module.exports = User