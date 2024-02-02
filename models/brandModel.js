const mongoose = require('mongoose')

//1-creat schema
const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Brand required"],
        unique: [true, "Brand must be unique"],
        mainlength: [3, "Too short Brand name"],
        maxlength: [32, "Too long Brand name"]
    },
    slug: {
        type: String,
        lowercase: true,
    },
    image: String,
},
    { timestamps: true }
);

const setImageURL = (doc) => {
    if (doc.image) {
        const imageUrl = `${process.env.BASE_URL}/brands/${doc.image}`;
        doc.image = imageUrl;
    }
}

brandSchema.post('init', (doc) => {
    setImageURL(doc);
});

//creat
brandSchema.post('save', (doc) => {
    setImageURL(doc);
});

//2-creat model
module.exports = mongoose.model("Brand", brandSchema)

