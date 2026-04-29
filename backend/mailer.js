const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services or SMTP host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 */
const sendOTP = async (email, otp) => {
  const isDevMode = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

  if (isDevMode) {
    console.log('\n======================================');
    console.log('⚠️  DEV MODE: Email not configured.');
    console.log(`📩 Simulated Email to: ${email}`);
    console.log(`🔑 Your OTP is: ${otp}`);
    console.log('======================================\n');
    return { success: true, message: 'OTP logged to console (DEV MODE)' };
  }

  try {
    const mailOptions = {
      from: `"RFID CRM System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Registration OTP - EduScan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #0dcaf0; text-align: center;">EduScan Registration</h2>
          <p>Hello,</p>
          <p>Thank you for registering on the EduScan RFID School Management System.</p>
          <p>Your one-time password (OTP) for account verification is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #f8f9fa; border-radius: 5px; letter-spacing: 5px;">
              ${otp}
            </span>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br><strong>EduScan Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP, transporter };