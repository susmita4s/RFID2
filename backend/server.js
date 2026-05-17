const express = require('express');
require("./db");
const cors = require('cors');
const dotenv = require('dotenv');

const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

app.set('io', io);

const prisma = require('./prismaClient');
const PORT = process.env.PORT || 5000;

const jwt = require('jsonwebtoken');

io.on('connection', (socket) => {
  console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

  // Join user-specific room based on JWT token
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded.userId;
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`✅ User ${userId} joined room user_${userId}`);
      }
    } catch (err) {
      console.log(`⚠️ Socket JWT verify failed: ${err.message}`);
    }
  }

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
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

// ─── Dashboard Routes ─────────────────────────────────────────────────────────
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// ─── Fees Routes ──────────────────────────────────────────────────────────────
const feesRoutes = require('./routes/fees');
app.use('/api/fees', feesRoutes);

// ─── Student Routes ───────────────────────────────────────────────────────────
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const walletRoutes = require('./routes/wallet');
const attendanceRoutes = require('./routes/attendance');
const paymentRechargeRoutes = require('./routes/payment_recharge');
const chatRoutes = require('./routes/chat');
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payment', paymentRechargeRoutes);
app.use('/api/chat', chatRoutes);

// ─── Bus Routes ───────────────────────────────────────────────────────────────
const busRoutes = require('./routes/bus');
app.use('/api/bus', busRoutes);

// ─── Library Routes ───────────────────────────────────────────────────────────
const libraryRoutes = require('./routes/library');
app.use('/api/library', libraryRoutes);

// ─── RFID Routes ──────────────────────────────────────────────────────────────
const rfidRoutes = require('./routes/rfid');
app.use('/api/rfid', rfidRoutes);

// ─── Parent Activation Routes ─────────────────────────────────────────────────
const parentsRoutes = require('./routes/parents');
app.use('/api/parents', parentsRoutes);

// ─── Meetings & Google Meet Routes ────────────────────────────────────────────
const meetingsRoutes = require('./routes/meetings');
app.use('/api/meetings', meetingsRoutes);


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
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO initialized`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// ─── Global Unhandled Error Recovery ──────────────────────────────────────────
// Prevent Node.js from crashing on database connection disconnects or background errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception thrown:', err);
});

module.exports = app;
