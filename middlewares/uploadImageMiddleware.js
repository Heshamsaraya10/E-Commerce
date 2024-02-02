const multer = require('multer')
const ApiError = require('../utils/apiError')

const multerOptions = () => {
    const multerStorage = multer.memoryStorage()

    const multerFilter = function (req, file, cb) {
        if (file.mimetype) {
            cb(null, true);
        } else {
            cb(new ApiError("Only images allowed", 400), false);
        }
    }

    const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
    return upload;
}

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);


exports.uploadMixOfImages = (arrayOfFields) => multerOptions().fields(arrayOfFields);
