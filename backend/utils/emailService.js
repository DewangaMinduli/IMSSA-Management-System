const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendVerificationEmail = async (email, verificationToken) => {
    // Assuming frontend runs on 5173
    const verifyLink = `http://localhost:5173/verify?token=${verificationToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'IMSSA Management System - Verify Your Email',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0f766e;">Welcome to IMSSA Management System!</h2>
                <p>Thank you for registering. To ensure you have access to your account and to protect the platform's security, please verify your email address.</p>
                <p>Click the button below to activate your account:</p>
                <a href="${verifyLink}" style="background-color: #0f766e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Verify Email</a>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">This link will expire in 24 hours.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[VERIFY EMAIL SENT] To: ${email}`);
        return true;
    } catch (error) {
        console.error('[VERIFY EMAIL FAIL] Error sending email:', error);
        console.log('\n--- [FALLBACK VERIFY LINK] ---');
        console.log(verifyLink);
        console.log('-----------------------\n');
        return false;
    }
};

exports.sendResetEmail = async (email, resetToken) => {
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'IMSSA Management System - Password Reset',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0f766e;">Password Reset Request</h2>
                <p>You requested to reset your password for the IMSSA Management System.</p>
                <p>Please click the button below to reset it:</p>
                <a href="${resetLink}" style="background-color: #0f766e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not request this, please ignore this email. This link will expire in 15 minutes.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] To: ${email}`);
        return true;
    } catch (error) {
        console.error('[EMAIL FAIL] Error sending email:', error);
        // Fallback to console log for development if credentials fail
        console.log('\n--- [FALLBACK LINK] ---');
        console.log(resetLink);
        console.log('-----------------------\n');
        return false;
    }
};
