const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── GET /api/students ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { class: cls, section, search } = req.query;
    const where = { isActive: true };

    if (cls)     where.class   = cls;
    if (section) where.section = section;
    if (search)  where.name    = { contains: search };

    const students = await prisma.student.findMany({
      where,
      orderBy: { rollNumber: 'asc' },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// ── GET /api/students/:id ─────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        busLogs:     { orderBy: { timestamp: 'desc' }, take: 10 },
        libraryLogs: { orderBy: { borrowedAt: 'desc' }, take: 10 },
        payments:    { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student.' });
  }
});

// ── POST /api/students ────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { name, rollNumber, class: cls, section, rfidTag, parentPhone, parentEmail, photoUrl } = req.body;

  if (!name || !rollNumber || !cls || !section) {
    return res.status(400).json({ error: 'Name, roll number, class, and section are required.' });
  }

  try {
    const student = await prisma.student.create({
      data: { name, rollNumber, class: cls, section, rfidTag, parentPhone, parentEmail, photoUrl },
    });
    res.status(201).json(student);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Roll number or RFID tag already exists.' });
    res.status(500).json({ error: 'Failed to create student.' });
  }
});

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const student = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data:  req.body,
    });
    res.json(student);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found.' });
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

// ── DELETE /api/students/:id (soft delete) ────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await prisma.student.update({
      where: { id: Number(req.params.id) },
      data:  { isActive: false },
    });
    res.json({ message: 'Student deactivated successfully.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found.' });
    res.status(500).json({ error: 'Failed to deactivate student.' });
  }
});

// ── GET /api/students/rfid/:tag ───────────────────────────────────────────────
router.get('/rfid/:tag', verifyToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { rfidTag: req.params.tag } });
    if (!student) return res.status(404).json({ error: 'No student found with this RFID tag.' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup RFID tag.' });
  }
});

module.exports = router;
