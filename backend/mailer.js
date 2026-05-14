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

/**
 * Send Password Reset OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 */
const sendResetPasswordOTP = async (email, otp) => {
  const isDevMode = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

  if (isDevMode) {
    console.log('\n======================================');
    console.log('⚠️  DEV MODE: Email not configured.');
    console.log(`📩 Simulated Password Reset Email to: ${email}`);
    console.log(`🔑 Your Reset OTP is: ${otp}`);
    console.log('======================================\n');
    return { success: true, message: 'OTP logged to console (DEV MODE)' };
  }

  try {
    const mailOptions = {
      from: `"RFID CRM System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - EduScan',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #0dcaf0; text-align: center;">EduScan Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your EduScan account.</p>
          <p>Your one-time password (OTP) for password reset is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #f8f9fa; border-radius: 5px; letter-spacing: 5px;">
              ${otp}
            </span>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <br>
          <p>Best regards,<br><strong>EduScan Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Password Reset OTP sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Parent Activation Email (Set Your Password)
 * @param {string} email - Parent Gmail
 * @param {string} parentName - Parent / guardian name
 * @param {string} studentName - Student full name
 * @param {string} activationLink - Full URL with token
 */
const sendActivationEmail = async (email, parentName, studentName, activationLink) => {
  const isDevMode = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

  if (isDevMode) {
    console.log('\n====================================================');
    console.log('⚠️  DEV MODE: Email not configured.');
    console.log(`📩 Simulated Activation Email to: ${email}`);
    console.log(`👤 Parent: ${parentName}`);
    console.log(`🎓 Student: ${studentName}`);
    console.log(`🔗 Activation Link: ${activationLink}`);
    console.log('====================================================\n');
    return { success: true, message: 'Activation link logged to console (DEV MODE)' };
  }

  try {
    const mailOptions = {
      from: `"EduScan School Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to EduScan – Set Your Parent Portal Password`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Set Your Password – EduScan</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 40px;text-align:center;">
                      <div style="display:inline-block;background:rgba(0,217,204,0.15);border:2px solid #00d9cc;border-radius:12px;padding:8px 16px;margin-bottom:16px;">
                        <span style="color:#00d9cc;font-size:22px;">💳</span>
                        <span style="color:#00d9cc;font-size:18px;font-weight:700;letter-spacing:1px;margin-left:8px;">EduScan</span>
                      </div>
                      <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px 0;">Parent Portal Invitation</h1>
                      <p style="color:#94a3b8;font-size:14px;margin:0;">RFID School Management System</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="color:#1e293b;font-size:16px;margin:0 0 16px 0;">Dear <strong>${parentName}</strong>,</p>
                      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
                        Welcome to <strong>EduScan</strong> – your child's school has registered
                        <strong style="color:#0f172a;"> ${studentName}</strong> on our RFID School Management Portal.
                      </p>
                      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px 0;">
                        To activate your Parent Portal account and start monitoring your child's
                        attendance, wallet, library activity, and more – please set your password
                        by clicking the button below.
                      </p>

                      <!-- CTA Button -->
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${activationLink}" 
                           style="display:inline-block;background:linear-gradient(135deg,#00d9cc,#0891b2);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(0,217,204,0.4);">
                          🔐 Set Your Password
                        </a>
                      </div>

                      <!-- Divider -->
                      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">

                      <!-- Info Box -->
                      <div style="background:#f8fafc;border-left:4px solid #00d9cc;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                        <p style="color:#0f172a;font-size:14px;font-weight:600;margin:0 0 8px 0;">⏰ Important Notice</p>
                        <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6;">
                          This activation link is valid for <strong>24 hours</strong> only. After it expires,
                          please contact your school administrator to resend the invitation.
                        </p>
                      </div>

                      <!-- Security Notice -->
                      <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                        <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 8px 0;">🔒 Security Notice</p>
                        <p style="color:#78350f;font-size:13px;margin:0;line-height:1.6;">
                          If you did not expect this email, please ignore it. Your account will remain
                          inactive and no one can access it without setting a password through this link.
                          Never share this link with anyone.
                        </p>
                      </div>

                      <!-- Link fallback -->
                      <p style="color:#94a3b8;font-size:12px;margin:0;">If the button doesn't work, copy and paste this link into your browser:</p>
                      <p style="word-break:break-all;">
                        <a href="${activationLink}" style="color:#0891b2;font-size:12px;">${activationLink}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                      <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;">© ${new Date().getFullYear()} EduScan RFID School Management System</p>
                      <p style="color:#cbd5e1;font-size:11px;margin:0;">This is an automated email. Please do not reply.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Activation email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending activation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTP, sendResetPasswordOTP, sendActivationEmail, transporter };