require("dotenv").config();
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
// Health check
app.get('/', (req, res) => {
  res.json({ message: 'RFID School Management API is running ✅', version: '1.0.0' });
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'disconnected', error: error.message });
  }
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ─── Student Routes ───────────────────────────────────────────────────────────
const studentRoutes = require('./routes/students');
app.use('/api/students', studentRoutes);

// ─── Attendance Routes ────────────────────────────────────────────────────────
const attendanceRoutes = require('./routes/attendance');
app.use('/api/attendance', attendanceRoutes);

// ─── Bus Routes ───────────────────────────────────────────────────────────────
const busRoutes = require('./routes/bus');
app.use('/api/bus', busRoutes);

// ─── Library Routes ───────────────────────────────────────────────────────────
const libraryRoutes = require('./routes/library');
app.use('/api/library', libraryRoutes);

// ─── Payment Routes ───────────────────────────────────────────────────────────
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
