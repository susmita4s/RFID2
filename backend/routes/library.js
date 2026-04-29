const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/library ──────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { studentId, action, overdue } = req.query;

    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (action)    where.action    = action;
    if (overdue === 'true') {
      where.action     = 'borrowed';
      where.returnedAt = null;
      where.dueDate    = { lt: new Date() };
    }

    const logs = await prisma.libraryLog.findMany({
      where,
      include: { student: { select: { name: true, rollNumber: true, class: true } } },
      orderBy: { borrowedAt: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch library logs.' });
  }
});

// ── POST /api/library/borrow ──────────────────────────────────────────────────
router.post('/borrow', verifyToken, async (req, res) => {
  const { studentId, rfidTag, bookTitle, bookId, dueDays } = req.body;

  if (!bookTitle) return res.status(400).json({ error: 'Book title is required.' });

  try {
    let resolvedStudentId = studentId;

    if (!resolvedStudentId && rfidTag) {
      const student = await prisma.student.findUnique({ where: { rfidTag } });
      if (!student) return res.status(404).json({ error: 'No student found with this RFID tag.' });
      resolvedStudentId = student.id;
    }

    if (!resolvedStudentId) return res.status(400).json({ error: 'studentId or rfidTag is required.' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (dueDays || 14));

    const log = await prisma.libraryLog.create({
      data: { studentId: resolvedStudentId, bookTitle, bookId, action: 'borrowed', dueDate },
      include: { student: { select: { name: true, rollNumber: true } } },
    });

    res.status(201).json({ message: 'Book borrowed successfully.', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record borrow.' });
  }
});

// ── PUT /api/library/return/:id ───────────────────────────────────────────────
router.put('/return/:id', verifyToken, async (req, res) => {
  try {
    const log = await prisma.libraryLog.findUnique({ where: { id: Number(req.params.id) } });
    if (!log) return res.status(404).json({ error: 'Library record not found.' });

    const returnedAt = new Date();
    let fine = 0;
    if (log.dueDate && returnedAt > log.dueDate) {
      const daysLate = Math.ceil((returnedAt - log.dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 2; // ₹2 per day fine
    }

    const updated = await prisma.libraryLog.update({
      where: { id: Number(req.params.id) },
      data:  { action: 'returned', returnedAt, fine },
    });

    res.json({ message: 'Book returned successfully.', fine, log: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record return.' });
  }
});

// ── GET /api/library/overdue ──────────────────────────────────────────────────
router.get('/overdue', verifyToken, async (req, res) => {
  try {
    const overdueBooks = await prisma.libraryLog.findMany({
      where: { action: 'borrowed', returnedAt: null, dueDate: { lt: new Date() } },
      include: { student: { select: { name: true, rollNumber: true, parentPhone: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json(overdueBooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue books.' });
  }
});

module.exports = router;
