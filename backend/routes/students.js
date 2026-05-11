const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');
const { parseISO, startOfDay, addMinutes } = require('date-fns');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to convert frontend date string "YYYY-MM-DD" to safe local midnight DB date
const convertToLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  // e.g. "2026-05-08" -> local Date without UTC shift
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day);
};

// ── GET /api/students ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, class: cls, status, joinedDate } = req.query;
    
    // We only fetch students belonging to this admin
    const where = { adminId: req.user.id, isActive: true };

    if (cls && cls !== 'All') where.className = cls;
    if (status && status !== 'All') where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { rfidTag: { contains: search } },
        { studentId: { contains: search } }
      ];
    }
    
    if (joinedDate) {
      const selectedDate = convertToLocalDate(joinedDate);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      
      where.joinedDate = {
        gte: selectedDate,
        lt: nextDay
      };
    }

    const students = await prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
});

// ── GET /api/students/:id ─────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!student || student.adminId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch student.' });
  }
});

// ── POST /api/students/create ─────────────────────────────────────────────────
router.post('/create', verifyToken, async (req, res) => {
  const { fullName, email, phoneNumber, gender, className, guardianName, rfidTag, joinedDate } = req.body;

  if (!fullName || !email || !phoneNumber || !className) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Generate STU-YYYY-XXX
    const year = new Date().getFullYear();
    const count = await prisma.student.count({ where: { studentId: { startsWith: `STU-${year}-` } } });
    const studentIdStr = `STU-${year}-${String(count + 1).padStart(3, '0')}`;
    
    // Generate dummy rollNumber for backwards compatibility
    const rollNumber = `R-${Date.now()}`;

    const localJoinedDate = convertToLocalDate(joinedDate);

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          studentId: studentIdStr,
          fullName,
          email,
          phoneNumber,
          gender,
          className,
          section: 'A', // Default
          guardianName,
          rfidTag: rfidTag || null,
          joinedDate: localJoinedDate,
          rollNumber,
          adminId: req.user.id,
          status: 'active'
        }
      });

      await tx.studentActivity.create({
        data: {
          studentId: newStudent.id,
          action: 'CREATED',
          description: `Student registered successfully.`
        }
      });

      if (rfidTag) {
        await tx.studentActivity.create({
          data: {
            studentId: newStudent.id,
            action: 'RFID_ASSIGNED',
            description: `RFID tag ${rfidTag} assigned at registration.`
          }
        });
      }

      return newStudent;
    });

    res.status(201).json({ success: true, message: 'Student registered successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email or RFID already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create student.' });
  }
});

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const existing = await prisma.student.findUnique({ where: { id: studentId } });
    
    if (!existing || existing.adminId !== req.user.id) {
       return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const stu = await tx.student.update({
        where: { id: studentId },
        data: req.body,
      });

      await tx.studentActivity.create({
        data: {
          studentId: stu.id,
          action: 'UPDATED',
          description: `Student profile updated.`
        }
      });
      return stu;
    });

    res.json({ success: true, message: 'Student updated successfully', student: updated });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Failed to update student.' });
  }
});

// ── PATCH /api/students/:id/status ────────────────────────────────────────────
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const { status } = req.body;
    
    const existing = await prisma.student.findUnique({ where: { id: studentId } });
    if (!existing || existing.adminId !== req.user.id) {
       return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const stu = await tx.student.update({
        where: { id: studentId },
        data: { status }
      });

      await tx.studentActivity.create({
        data: {
          studentId: stu.id,
          action: status === 'active' ? 'ACCESS_ENABLED' : 'ACCESS_DISABLED',
          description: `Student access changed to ${status}.`
        }
      });
      return stu;
    });

    res.json({ success: true, message: `Access ${status === 'active' ? 'enabled' : 'disabled'} successfully`, student: updated });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ── DELETE /api/students/:id ──────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const existing = await prisma.student.findUnique({ where: { id: studentId } });
    if (!existing || existing.adminId !== req.user.id) {
       return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { isActive: false, status: 'inactive' }
    });

    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
});

// ── POST /api/students/assign-rfid ────────────────────────────────────────────
router.post('/assign-rfid', verifyToken, async (req, res) => {
  try {
    // Just generate a unique unused RFID string
    let rfid = '';
    let isUnique = false;
    while (!isUnique) {
      const randomHex = Math.random().toString(16).toUpperCase().substring(2, 6);
      rfid = `RFID-${randomHex}`;
      const existing = await prisma.student.findUnique({ where: { rfidTag: rfid } });
      if (!existing) isUnique = true;
    }
    
    res.json({ success: true, rfid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate RFID.' });
  }
});

module.exports = router;
