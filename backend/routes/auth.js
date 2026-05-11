const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendOTP, sendResetPasswordOTP } = require('../mailer');

const router = express.Router();
const prisma = new PrismaClient();

// ── Helper: Generate OTP ──────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

// ── Middleware: Verify JWT ────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, role, schoolName } = req.body;

    // 1. Missing fields validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields (firstName, lastName, email, password, confirmPassword) are required.' });
    }

    // 2. Password matching
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // 3. Password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // 4. Invalid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone ? phone.trim() : null;

    // 5. Duplicate email check
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    const userRole = role ? role.toLowerCase() : 'parent';

    // Admin validation for one admin per school
    if (userRole === 'admin') {
      if (!schoolName) {
        return res.status(400).json({ success: false, message: 'School name is required for admin registration.' });
      }
      
      const existingSchool = await prisma.school.findUnique({
        where: { name: schoolName },
        include: { admin: true }
      });
      
      if (existingSchool && existingSchool.admin) {
        return res.status(400).json({ success: false, message: 'Admin already exists for this school' });
      }
    }

    // Setup OTP logic
    let registrationOtp = generateOTP();
    let otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: { 
        firstName, 
        lastName,
        email: normalizedEmail,
        phone: trimmedPhone,
        password: hashed, 
        role: userRole,
        isVerified: false,
        registrationOtp,
        otpExpiry
      },
    });

    await sendOTP(normalizedEmail, registrationOtp);
    
    res.status(201).json({ 
      success: true,
      message: 'Registration successful. Please verify your email.', 
      requireOtp: true, 
      email: user.email,
      schoolName: userRole === 'admin' ? schoolName : undefined
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed due to server error.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp, schoolName } = req.body;

  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ error: 'User is already verified.' });

    if (user.registrationOtp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP.' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ error: 'OTP expired, request a new one.' });
    }

    // Admin-specific school logic
    if (user.role === 'admin' && schoolName) {
      // Find or create school
      let school = await prisma.school.findUnique({ where: { name: schoolName } });
      if (!school) {
        school = await prisma.school.create({ data: { name: schoolName } });
      }
      
      // Mark as verified and link to school
      await prisma.user.update({
        where: { email },
        data: { 
          isVerified: true, 
          registrationOtp: null, 
          otpExpiry: null,
          schoolId: school.id 
        },
      });

      // Generate token for auto-login
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({ 
        success: true,
        message: 'Admin verified and school linked successfully.',
        token,
        admin: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, schoolName: user.school?.name || schoolName }
      });
    }

    // Mark as verified for parents
    await prisma.user.update({
      where: { email },
      data: { isVerified: true, registrationOtp: null, otpExpiry: null },
    });

    res.json({ success: true, message: 'Account verified successfully. You can now login.' });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ error: 'User is already verified.' });

    const registrationOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { registrationOtp, otpExpiry },
    });

    await sendOTP(email, registrationOtp);
    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP.' });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const resetPasswordOtp = generateOTP();
    const resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { email },
      data: { resetPasswordOtp, resetPasswordExpiry },
    });

    await sendResetPasswordOTP(email, resetPasswordOtp);
    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ error: 'Incorrect OTP.' });
    }

    if (new Date() > new Date(user.resetPasswordExpiry)) {
      return res.status(400).json({ error: 'OTP expired, request a new one.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashed, 
        resetPasswordOtp: null, 
        resetPasswordExpiry: null 
      },
    });

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    // Block unverified parents
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before login.',
        requireOtp: true,
        email: user.email
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const payload = {
      success: true,
      message: 'Login successful.',
      token,
    };

    if (user.role === 'admin') {
      const userWithSchool = await prisma.user.findUnique({
        where: { id: user.id },
        include: { school: true }
      });
      payload.admin = { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        phone: user.phone,
        role: user.role,
        schoolName: userWithSchool?.school?.name 
      };
    } else {
      payload.user = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
    }

    res.json(payload);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isVerified: true, createdAt: true, school: true },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin') {
      return res.json({
        success: true,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        schoolName: user.school?.name
      });
    }

    res.json({ success: true, ...user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', verifyToken, (req, res) => {
  // With JWT, logout is handled on the client by discarding the token.
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
