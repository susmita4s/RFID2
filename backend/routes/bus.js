const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/bus ──────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { studentId, date, route } = req.query;

    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (route)     where.busRoute  = route;
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.timestamp = { gte: d, lt: nextDay };
    }

    const logs = await prisma.busLog.findMany({
      where,
      include: { student: { select: { name: true, rollNumber: true, class: true, section: true } } },
      orderBy: { timestamp: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bus logs.' });
  }
});

// ── POST /api/bus — Log boarding/alighting via RFID ──────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { studentId, rfidTag, action, busRoute, location } = req.body;

  if (!action || !['boarded', 'alighted'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "boarded" or "alighted".' });
  }

  try {
    let resolvedStudentId = studentId;

    if (!resolvedStudentId && rfidTag) {
      const student = await prisma.student.findUnique({ where: { rfidTag } });
      if (!student) return res.status(404).json({ error: 'No student found with this RFID tag.' });
      resolvedStudentId = student.id;
    }

    if (!resolvedStudentId) return res.status(400).json({ error: 'studentId or rfidTag is required.' });

    const log = await prisma.busLog.create({
      data: { studentId: resolvedStudentId, action, busRoute, location },
      include: { student: { select: { name: true, rollNumber: true } } },
    });

    res.status(201).json({ message: `Student ${log.action} successfully.`, log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log bus action.' });
  }
});

// ── GET /api/bus/today ────────────────────────────────────────────────────────
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await prisma.busLog.findMany({
      where: { timestamp: { gte: today, lt: tomorrow } },
      include: { student: { select: { name: true, rollNumber: true, class: true } } },
      orderBy: { timestamp: 'desc' },
    });

    const boarded  = logs.filter(l => l.action === 'boarded').length;
    const alighted = logs.filter(l => l.action === 'alighted').length;

    res.json({ date: today, boarded, alighted, total: logs.length, logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s bus logs.' });
  }
});

module.exports = router;
