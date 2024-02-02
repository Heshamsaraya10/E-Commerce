const nodemailer = require('nodemailer');
// Nodemailer
const sendEmail = async (options) => {
    // 1) Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: { rejectUnauthorized: false },
    });
    // 2) Define email options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };
    // 3) Send email
    transporter.sendMail(mailOptions)
};

module.exports = sendEmail;
