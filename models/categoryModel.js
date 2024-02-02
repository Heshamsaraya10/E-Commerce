const mongoose = require('mongoose')

//1-creat schema
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "category required"],
        unique: [true, "category must be unique"],
        mainlength: [3, "Too short category name"],
        maxlength: [32, "Too long category name"]
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
        const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
        doc.image = imageUrl;
    }
}

categorySchema.post('init', (doc) => {
    setImageURL(doc);
});

//creat
categorySchema.post('save', (doc) => {
    setImageURL(doc);
});


//2-creat model
const CategoryModel = mongoose.model("Category", categorySchema)

module.exports = CategoryModel;