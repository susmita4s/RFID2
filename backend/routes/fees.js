const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/fees/stats ──────────────────────────────────────────────────────
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // Total Collection
    const totalCollectionObj = await prisma.feeTransaction.aggregate({
      _sum: { amount: true },
      where: { status: 'Completed' }
    });
    const totalCollection = totalCollectionObj._sum.amount || 0;

    // Pending Dues
    const pendingDuesObj = await prisma.feeTransaction.aggregate({
      _sum: { amount: true },
      where: { status: 'Pending' }
    });
    const pendingDues = pendingDuesObj._sum.amount || 0;

    // RFID Refills
    const rfidRefillsObj = await prisma.feeTransaction.aggregate({
      _sum: { amount: true },
      where: { description: 'RFID Refill', status: 'Completed' }
    });
    const rfidRefills = rfidRefillsObj._sum.amount || 0;

    // Total Transactions
    const totalTransactions = await prisma.feeTransaction.count();

    res.json({
      success: true,
      data: {
        totalCollection,
        pendingDues,
        rfidRefills,
        totalTransactions
      }
    });
  } catch (error) {
    console.error('Fees Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fee stats.' });
  }
});

// ── GET /api/fees/transactions ───────────────────────────────────────────────
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await prisma.feeTransaction.findMany({
      include: {
        student: { select: { fullName: true, studentId: true, profileImage: true, rfidWallet: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = transactions.map(txn => ({
      id: txn.id.slice(-6).toUpperCase(), // Shorten UUID for display like TXN-001
      student: txn.student?.fullName || 'Unknown Student',
      stuId: txn.student?.studentId || 'N/A',
      type: txn.description,
      date: new Date(txn.createdAt).toISOString().split('T')[0],
      amount: `₹${txn.amount.toLocaleString('en-IN')}`,
      status: txn.status,
      method: txn.paymentType,
      balance: txn.student?.rfidWallet ? `₹${txn.student.rfidWallet.balance.toLocaleString('en-IN')}` : 'N/A'
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Fees Transactions Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// ── POST /api/fees/create ────────────────────────────────────────────────────
router.post('/create', verifyToken, async (req, res) => {
  const { studentId, description, amount, status, paymentType } = req.body;
  
  if (!studentId || !description || amount === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    let student = await prisma.student.findUnique({ where: { studentId: studentId } });
    if (!student) {
      student = await prisma.student.findUnique({ where: { rfidTag: studentId } });
    }
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const newTxn = await prisma.feeTransaction.create({
      data: {
        studentId: student.id,
        description,
        amount: Number(amount),
        status: status || 'Completed',
        paymentType: paymentType || 'Cash'
      }
    });

    // If it's an RFID refill, update wallet balance
    if (description === 'RFID Refill' && (status === 'Completed' || !status)) {
      await prisma.rFIDWallet.upsert({
        where: { studentId: student.id },
        update: { balance: { increment: Number(amount) } },
        create: { studentId: student.id, balance: Number(amount) }
      });
    }

    res.status(201).json({ success: true, data: newTxn });
  } catch (error) {
    console.error('Create Fee Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transaction.' });
  }
});

// ── GET /api/fees/student/:id ────────────────────────────────────────────────
router.get('/student/:id', verifyToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        feeTransactions: { orderBy: { createdAt: 'desc' } },
        rfidWallet: true
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Student Fees Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student fees.' });
  }
});

module.exports = router;
