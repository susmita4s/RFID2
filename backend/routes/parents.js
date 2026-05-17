const express = require('express');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendActivationEmail, sendOTP } = require('../mailer');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── Helper: Generate secure 64-char hex token ────────────────────────────────
const generateActivationToken = () => crypto.randomBytes(32).toString('hex');

// ────────────────────────────────────────────────────────────────────────────
// POST /api/parents/send-activation
// Called internally after a student is created.
// Creates an inactive parent User record (or reuses existing) and sends
// a "Set Your Password" email with a secure token link.
// ────────────────────────────────────────────────────────────────────────────
router.post('/send-activation', verifyToken, async (req, res) => {
  const { parentEmail, parentName, studentName, studentId } = req.body;

  if (!parentEmail || !studentName) {
    return res.status(400).json({ success: false, message: 'parentEmail and studentName are required.' });
  }

  try {
    // Check if a parent User already exists for this email
    let parentUser = await prisma.user.findUnique({ where: { email: parentEmail } });

    const activationToken  = generateActivationToken();
    const activationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    if (parentUser) {
      // Parent already exists (maybe re-registered or duplicate) — just re-send activation
      // Force them to verify again so the complete flow always occurs
      const nameParts = (parentName || 'Parent').split(' ');
      await prisma.user.update({
        where: { email: parentEmail },
        data: { 
          firstName: nameParts[0] || 'Parent',
          lastName:  nameParts.slice(1).join(' ') || '',
          isVerified: false, 
          activationToken, 
          activationExpiry 
        }
      });
    } else {
      // Create new INACTIVE parent account — no password yet
      const nameParts = (parentName || 'Parent').split(' ');
      parentUser = await prisma.user.create({
        data: {
          firstName: nameParts[0] || 'Parent',
          lastName:  nameParts.slice(1).join(' ') || '',
          email:     parentEmail,
          password:  '', // No password until they set it
          role:      'parent',
          isVerified: false,  // Inactive until password is set
          isFirstLogin: true,
          activationToken,
          activationExpiry
        }
      });
    }

    // Link parent to student if studentId provided
    if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
      if (student && !student.userId) {
        await prisma.student.update({
          where: { id: Number(studentId) },
          data:  { userId: parentUser.id }
        });
      }
    }

    // Build the activation URL
    const frontendUrl    = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationLink = `${frontendUrl}/parent/set-password?token=${activationToken}`;

    // Send the professional activation email
    const emailResult = await sendActivationEmail(
      parentEmail,
      parentName || 'Parent',
      studentName,
      activationLink
    );

    if (!emailResult.success) {
      console.error('⚠️ Activation email failed to send:', emailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'Activation email sent successfully.',
      // Only expose in DEV mode for testing
      ...(process.env.NODE_ENV !== 'production' && { activationLink })
    });

  } catch (error) {
    console.error('send-activation error:', error);
    res.status(500).json({ success: false, message: 'Failed to send activation email.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/parents/validate-token?token=<token>
// Frontend calls this when the Set Password page loads to verify the token.
// ────────────────────────────────────────────────────────────────────────────
router.get('/validate-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required.' });
  }

  try {
    const parentUser = await prisma.user.findUnique({
      where: { activationToken: token },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isVerified: true,
        activationExpiry: true
      }
    });

    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Invalid activation link. This link does not exist or has already been used.',
        code: 'TOKEN_INVALID'
      });
    }

    if (parentUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This account has already been activated. Please login.',
        code: 'ALREADY_ACTIVE'
      });
    }

    if (new Date() > new Date(parentUser.activationExpiry)) {
      return res.status(410).json({
        success: false,
        message: 'This activation link has expired. Please contact your school administrator.',
        code: 'TOKEN_EXPIRED'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid.',
      parent: {
        firstName: parentUser.firstName,
        lastName:  parentUser.lastName,
        email:     parentUser.email
      }
    });

  } catch (error) {
    console.error('validate-token error:', error);
    res.status(500).json({ success: false, message: 'Token validation failed.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/parents/set-password
// Parent submits their new password via the Set Password page.
// Validates token, hashes password, activates account, removes token.
// ────────────────────────────────────────────────────────────────────────────
router.post('/set-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Token, password, and confirmPassword are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }

  // Basic strength check
  const hasUpperCase  = /[A-Z]/.test(password);
  const hasLowerCase  = /[a-z]/.test(password);
  const hasNumber     = /[0-9]/.test(password);
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    });
  }

  try {
    const parentUser = await prisma.user.findUnique({
      where: { activationToken: token }
    });

    if (!parentUser) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already-used activation link.',
        code: 'TOKEN_INVALID'
      });
    }

    if (parentUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already active. Please login.',
        code: 'ALREADY_ACTIVE'
      });
    }

    if (new Date() > new Date(parentUser.activationExpiry)) {
      return res.status(410).json({
        success: false,
        message: 'This activation link has expired. Please contact your school administrator.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Activate the account — clear token, set password, mark verified
    await prisma.user.update({
      where: { id: parentUser.id },
      data: {
        password:        hashedPassword,
        isVerified:      true,   // Account is now active
        isFirstLogin:    true,   // Will be set to false after first successful login
        activationToken:  null,  // Token consumed — cannot be reused
        activationExpiry: null
      }
    });

    console.log(`✅ Parent account activated: ${parentUser.email}`);

    res.json({
      success: true,
      message: 'Password created successfully! Your account is now active.',
      email: parentUser.email
    });

  } catch (error) {
    console.error('set-password error:', error);
    res.status(500).json({ success: false, message: 'Failed to set password. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/parents/login
// Parent login: checks password, generates OTP, sends it, returns requiresOTP
// ────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'parent') return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email via the activation link before login.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { registrationOtp: otp, otpExpiry }
    });

    // Send OTP email
    await sendOTP(user.email, otp);

    res.json({ success: true, requiresOTP: true, email: user.email });

  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/parents/verify-otp
// ────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.registrationOtp !== otp || new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // Clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { registrationOtp: null, otpExpiry: null, isFirstLogin: false }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Parent verify OTP error:', error);
    res.status(500).json({ error: 'OTP verification failed.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/parents/student-details
// ────────────────────────────────────────────────────────────────────────────
router.get('/student-details', verifyToken, async (req, res) => {
  try {
    // Fetch student using loggedInParentId
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    });

    if (!student) return res.status(404).json({ error: 'No student linked to this parent account.' });

    res.json({ success: true, student });
  } catch (error) {
    console.error('Fetch student details error:', error);
    res.status(500).json({ error: 'Failed to fetch student details.' });
  }
});

module.exports = router;
