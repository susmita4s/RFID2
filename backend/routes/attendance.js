const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/attendance ───────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { date, studentId, class: cls, section } = req.query;

    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      where.date = { gte: d, lt: nextDay };
    }
    if (cls || section) {
      where.student = {};
      if (cls)     where.student.class   = cls;
      if (section) where.student.section = section;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { name: true, rollNumber: true, class: true, section: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

// ── POST /api/attendance — Mark attendance (RFID scan or manual) ───────────────
router.post('/', verifyToken, async (req, res) => {
  const { studentId, rfidTag, status, checkIn, date } = req.body;

  try {
    let resolvedStudentId = studentId;

    // Lookup by RFID if studentId not provided
    if (!resolvedStudentId && rfidTag) {
      const student = await prisma.student.findUnique({ where: { rfidTag } });
      if (!student) return res.status(404).json({ error: 'No student found with this RFID tag.' });
      resolvedStudentId = student.id;
    }

    if (!resolvedStudentId) return res.status(400).json({ error: 'studentId or rfidTag is required.' });

    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay   = new Date(attendanceDate.setHours(23, 59, 59, 999));

    // Upsert — update if already exists for today
    const existing = await prisma.attendance.findFirst({
      where: { studentId: resolvedStudentId, date: { gte: startOfDay, lte: endOfDay } },
    });

    let record;
    if (existing) {
      record = await prisma.attendance.update({
        where: { id: existing.id },
        data:  { status: status || existing.status, checkOut: new Date() },
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          studentId: resolvedStudentId,
          status:    status || 'present',
          checkIn:   checkIn ? new Date(checkIn) : new Date(),
          date:      new Date(),
        },
      });
    }

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark attendance.' });
  }
});

// ── GET /api/attendance/summary ───────────────────────────────────────────────
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [present, absent, late, total] = await Promise.all([
      prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'present' } }),
      prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'absent'  } }),
      prisma.attendance.count({ where: { date: { gte: today, lt: tomorrow }, status: 'late'    } }),
      prisma.student.count({ where: { isActive: true } }),
    ]);

    res.json({ date: today, total, present, absent, late, unmarked: total - present - absent - late });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance summary.' });
  }
});

module.exports = router;
