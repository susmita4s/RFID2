const express = require('express');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = require('../prismaClient');
// Helper for local date
const getLocalDateBounds = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

// ── GET /api/attendance ───────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { date, search, class: cls } = req.query;
    const { startOfDay, endOfDay } = getLocalDateBounds(date);

    const where = { isActive: true };
    if (cls && cls !== 'All Classes') where.className = cls;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { studentId: { contains: search } }
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        attendances: {
          where: { date: { gte: startOfDay, lte: endOfDay } }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    const formattedData = students.map(student => {
      const attendance = student.attendances[0];
      return {
        dbId: student.id,
        id: student.studentId || `STU-${student.id}`,
        name: student.fullName,
        class: student.className,
        profileImage: student.profileImage,
        checkIn: attendance?.checkIn ? new Date(attendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
        checkOut: attendance?.checkOut ? new Date(attendance.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
        status: attendance?.status || 'absent',
        phone: student.phoneNumber || 'N/A',
        rfidEnabled: attendance ? attendance.rfidEnabled : false,
        attendanceId: attendance?.id || null
      };
    });

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance.' });
  }
});

// ── GET /api/attendance/stats ─────────────────────────────────────────────────
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    const { startOfDay, endOfDay } = getLocalDateBounds(date);

    const attendances = await prisma.attendance.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } }
    });

    let present = 0;
    let late = 0;
    let halfDay = 0;
    let activeTags = 0;

    attendances.forEach(a => {
      if (a.status === 'present') present++;
      if (a.status === 'late') late++;
      if (a.status === 'half-day') halfDay++;
      if (a.rfidEnabled) activeTags++;
    });

    // Absent is total students minus present/late/half-day
    const totalStudents = await prisma.student.count({ where: { isActive: true } });
    const absent = totalStudents - present - late - halfDay;

    res.json({ success: true, stats: { present, absent, late, activeTags } });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
});

// ── POST /api/attendance/check-in ─────────────────────────────────────────────
router.post('/check-in', verifyToken, async (req, res) => {
  const { studentDbId, date, time } = req.body;
  if (!studentDbId) return res.status(400).json({ success: false, error: 'Student ID required.' });

  try {
    const targetDate = date ? new Date(date) : new Date();
    const checkInTime = time ? new Date(`${date}T${time}`) : new Date();
    const { startOfDay, endOfDay } = getLocalDateBounds(date);

    // Calculate Status (Late if after 9:00 AM)
    const lateThreshold = new Date(targetDate);
    lateThreshold.setHours(9, 0, 0, 0);
    const status = checkInTime > lateThreshold ? 'late' : 'present';

    let attendance = await prisma.attendance.findFirst({
      where: { studentId: studentDbId, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkIn: checkInTime, status }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId: studentDbId,
          date: targetDate,
          checkIn: checkInTime,
          status,
          adminId: req.user.role === 'admin' ? req.user.id : null
        }
      });
    }

    await prisma.attendanceActivity.create({
      data: {
        attendanceId: attendance.id,
        action: 'CHECK_IN',
        description: `Checked in at ${checkInTime.toLocaleTimeString()}`
      }
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, error: 'Failed to check in.' });
  }
});

// ── POST /api/attendance/check-out ────────────────────────────────────────────
router.post('/check-out', verifyToken, async (req, res) => {
  const { studentDbId, date, time } = req.body;
  if (!studentDbId) return res.status(400).json({ success: false, error: 'Student ID required.' });

  try {
    const { startOfDay, endOfDay } = getLocalDateBounds(date);
    const checkOutTime = time ? new Date(`${date}T${time}`) : new Date();

    let attendance = await prisma.attendance.findFirst({
      where: { studentId: studentDbId, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (!attendance) {
      return res.status(404).json({ success: false, error: 'No check-in found for this date.' });
    }

    // Half day if checkout before 2:00 PM
    const halfDayThreshold = new Date(attendance.date);
    halfDayThreshold.setHours(14, 0, 0, 0);
    const status = checkOutTime < halfDayThreshold ? 'half-day' : attendance.status;

    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: checkOutTime, status }
    });

    await prisma.attendanceActivity.create({
      data: {
        attendanceId: attendance.id,
        action: 'CHECK_OUT',
        description: `Checked out at ${checkOutTime.toLocaleTimeString()}`
      }
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, error: 'Failed to check out.' });
  }
});

// ── POST /api/attendance/mark-absent ──────────────────────────────────────────
router.post('/mark-absent', verifyToken, async (req, res) => {
  const { studentDbId, date } = req.body;
  if (!studentDbId) return res.status(400).json({ success: false, error: 'Student ID required.' });

  try {
    const targetDate = date ? new Date(date) : new Date();
    const { startOfDay, endOfDay } = getLocalDateBounds(date);

    let attendance = await prisma.attendance.findFirst({
      where: { studentId: studentDbId, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkIn: null, checkOut: null, status: 'absent' }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId: studentDbId,
          date: targetDate,
          status: 'absent',
          adminId: req.user.role === 'admin' ? req.user.id : null
        }
      });
    }

    await prisma.attendanceActivity.create({
      data: {
        attendanceId: attendance.id,
        action: 'MARK_ABSENT',
        description: `Manually marked absent`
      }
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Mark absent error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark absent.' });
  }
});

// ── PATCH /api/attendance/rfid-toggle/:studentDbId ────────────────────────────
router.patch('/rfid-toggle/:studentDbId', verifyToken, async (req, res) => {
  const { date, enabled } = req.body;
  const studentDbId = Number(req.params.studentDbId);
  const targetDate = date ? new Date(date) : new Date();
  const { startOfDay, endOfDay } = getLocalDateBounds(date);

  try {
    let attendance = await prisma.attendance.findFirst({
      where: { studentId: studentDbId, date: { gte: startOfDay, lte: endOfDay } }
    });

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { rfidEnabled: enabled }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId: studentDbId,
          date: targetDate,
          rfidEnabled: enabled,
          status: 'absent',
          adminId: req.user.role === 'admin' ? req.user.id : null
        }
      });
    }

    await prisma.attendanceActivity.create({
      data: {
        attendanceId: attendance.id,
        action: 'RFID_TOGGLE',
        description: `RFID tracking ${enabled ? 'enabled' : 'disabled'}`
      }
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('RFID Toggle error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle RFID.' });
  }
});

// ── DELETE /api/attendance/:id ────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.attendance.delete({ where: { id } });
    res.json({ success: true, message: 'Attendance record deleted.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete entry.' });
  }
});

module.exports = router;
