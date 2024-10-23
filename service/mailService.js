const nodemailer = require("nodemailer");

const sendVerifyMail = async (email, id) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const verificationLink = `http://localhost:3000/api/v1/users/verify/${id}`;

        const mailOptions = {
            from: `"24fs Collection" no-reply@24fscollection.com>`,
            to: email,
            subject: 'Account Verification - Action Required',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
                    <table style="width: 100%; border: none; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
                        <tr>
                            <td style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
                                <p style="font-size: 16px; line-height: 1.6; text-align: center;">
                                    Hello you,<br>Thank you for signing up! Please verify your email address to complete your registration.
                                </p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${verificationLink}" style="display: inline-block; background-color: #28a745; color: #fff; text-decoration: none; padding: 10px 20px; font-size: 16px; border-radius: 4px;">Verify Your Email</a>
                                </div>
                                <p style="font-size: 14px; text-align: center; color: #777;">
                                    If you did not request this, please ignore this email.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; padding: 20px 0; font-size: 12px; color: #999;">
                                <p>Best regards,</p>
                                <p>24fs Collection</p>
                            </td>
                        </tr>
                    </table>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully!');

    } catch (error) {
        console.error('Error: ', error);
        throw error;
    }
};

module.exports = {
    sendVerifyMail: sendVerifyMail
};