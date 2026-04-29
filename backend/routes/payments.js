const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/payments ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { studentId, status, type } = req.query;

    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (status)    where.status    = status;
    if (type)      where.type      = type;

    const payments = await prisma.payment.findMany({
      where,
      include: { student: { select: { name: true, rollNumber: true, class: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// ── POST /api/payments ────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { studentId, amount, type, description, dueDate } = req.body;

  if (!studentId || !amount || !type) {
    return res.status(400).json({ error: 'studentId, amount, and type are required.' });
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        studentId: Number(studentId),
        amount:    parseFloat(amount),
        type,
        description,
        dueDate:   dueDate ? new Date(dueDate) : null,
        status:    'pending',
      },
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment.' });
  }
});

// ── PUT /api/payments/:id/pay ─────────────────────────────────────────────────
router.put('/:id/pay', verifyToken, async (req, res) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: Number(req.params.id) },
      data:  { status: 'paid', paidAt: new Date() },
    });
    res.json({ message: 'Payment marked as paid.', payment });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Payment not found.' });
    res.status(500).json({ error: 'Failed to update payment.' });
  }
});

// ── GET /api/payments/summary ─────────────────────────────────────────────────
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const [paid, pending, overdue] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'paid'    } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'pending' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'overdue' } }),
    ]);

    res.json({
      collected: paid.    _sum.amount || 0,
      pending:   pending. _sum.amount || 0,
      overdue:   overdue. _sum.amount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment summary.' });
  }
});

// ── DELETE /api/payments/:id ──────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Payment deleted.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Payment not found.' });
    res.status(500).json({ error: 'Failed to delete payment.' });
  }
});

module.exports = router;
