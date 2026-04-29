const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendOTP } = require('../mailer');

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
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // If user exists but unverified, we could resend OTP or tell them. For now, just say registered.
      if (!existing.isVerified) {
        return res.status(409).json({ error: 'Email already registered but unverified. Please login to verify.' });
      }
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userRole = role ? role.toLowerCase() : 'parent'; // Default new registrations to parent if not provided

    // Setup OTP logic for Parents
    let isVerified = true;
    let registrationOtp = null;
    let otpExpiry = null;

    if (userRole === 'parent') {
      isVerified = false;
      registrationOtp = generateOTP();
      otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashed, 
        role: userRole,
        isVerified,
        registrationOtp,
        otpExpiry
      },
    });

    if (!isVerified && registrationOtp) {
      await sendOTP(email, registrationOtp);
      return res.status(201).json({ 
        message: 'Registration successful. Please verify your email.', 
        requireOtp: true, 
        email: user.email 
      });
    }

    res.status(201).json({ message: 'User registered successfully.', userId: user.id });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

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

    // Mark as verified
    await prisma.user.update({
      where: { email },
      data: { isVerified: true, registrationOtp: null, otpExpiry: null },
    });

    res.json({ message: 'Account verified successfully. You can now login.' });
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
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
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
      select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', verifyToken, (req, res) => {
  // With JWT, logout is handled on the client by discarding the token.
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
