const path = require("path");

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');


dotenv.config({ path: "config.env" });
const ApiError = require('./utils/apiError');
const globalError = require('./middlewares/errorMiddleware');
const dbConnection = require('./config/database');


//Routes
const mountRoutes = require('./routes')



//connect with db
dbConnection();

//express app
const app = express();

//Enable other domains to access your application
app.use(cors());
app.options('*', cors());

// compress all responses
app.use(compression());


//middlewares
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'uploads')));


if (process.env.NODE_ENV === "development") {
    app.use(morgan('dev'))
    console.log(`mode: ${process.env.NODE_ENV}`)
}

// To apply data sanitization
app.use(mongoSanitize());

// Limit each IP to 100 requests per `window` (here, per 15 minutes).
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many accounts from this IP , please try again after an hour.'
})

// Apply the rate limiting middleware to all requests.
app.use('/api', limiter)

// middleware to protect against HTTP Parameter Pollution attacks
app.use(hpp({ whitelist: ['price', 'sold', 'quantity', 'ratingsQuantity', 'ratingsAverage'] }));

//Mount Routes
mountRoutes(app)




app.all("*", (req, res, next) => {
    next(new ApiError(`Cant find this route : ${req.originalUrl}`, 400))
})

// Global error handling middleware for express
app.use(globalError)


const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`)
});


//Handel rejection outeside express
process.on("unhandledRejection", (err) => {
    console.log(`UnhandledRejection Error: ${err.name} | ${err.message} `)
    server.close(() => {
        console.log(`Shutting down....`)
        process.exit(1)
    })
})