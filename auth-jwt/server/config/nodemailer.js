import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 456,
    secure: true, 
    service: "gmail",
    auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS, 
    },
    tls: {
        rejectUnauthorized: true, 
    }
});

export default transporter;
