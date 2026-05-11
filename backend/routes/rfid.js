const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Helper for local date
const getLocalDateBounds = () => {
  const date = new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay, now: date };
};

// ── POST /api/rfid/scan ───────────────────────────────────────────────────────
// Expected body: { rfidTag: "..." }
router.post('/scan', async (req, res) => {
  const { rfidTag } = req.body;
  if (!rfidTag) return res.status(400).json({ success: false, error: 'RFID Tag required' });

  try {
    const student = await prisma.student.findUnique({
      where: { rfidTag }
    });

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found with this tag' });
    }

    if (!student.isActive) {
      return res.status(403).json({ success: false, error: 'Student account is inactive' });
    }

    const { startOfDay, endOfDay, now } = getLocalDateBounds();

    let attendance = await prisma.attendance.findFirst({
      where: { studentId: student.id, date: { gte: startOfDay, lte: endOfDay } }
    });

    // If tracking is disabled for today, block the scan.
    if (attendance && !attendance.rfidEnabled) {
      return res.status(403).json({ success: false, error: 'RFID tracking disabled for this student today.' });
    }

    const lateThreshold = new Date(now);
    lateThreshold.setHours(9, 0, 0, 0);

    let action = '';

    if (!attendance || !attendance.checkIn) {
      // It's a check-in
      const status = now > lateThreshold ? 'late' : 'present';
      
      if (attendance) {
        attendance = await prisma.attendance.update({
          where: { id: attendance.id },
          data: { checkIn: now, status }
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            studentId: student.id,
            date: now,
            checkIn: now,
            status,
            rfidEnabled: true // Enable by default on first scan
          }
        });
      }
      action = 'CHECK_IN';
    } else {
      // It's a check-out
      const halfDayThreshold = new Date(now);
      halfDayThreshold.setHours(14, 0, 0, 0);
      const status = now < halfDayThreshold ? 'half-day' : attendance.status;

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkOut: now, status }
      });
      action = 'CHECK_OUT';
    }

    // Log Activity
    await prisma.attendanceActivity.create({
      data: {
        attendanceId: attendance.id,
        action,
        description: `RFID ${action === 'CHECK_IN' ? 'Check-in' : 'Check-out'} via gateway`
      }
    });

    res.json({
      success: true,
      action,
      student: { name: student.fullName, rollNumber: student.rollNumber },
      time: now.toLocaleTimeString(),
      status: attendance.status
    });
  } catch (error) {
    console.error('RFID Scan Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── POST /api/rfid/bus-scan ───────────────────────────────────────────────────
router.post('/bus-scan', async (req, res) => {
  const { rfidTag, busId, locationName } = req.body;
  if (!rfidTag || !busId || !locationName) {
    return res.status(400).json({ success: false, error: 'RFID Tag, busId, and locationName are required' });
  }

  try {
    const student = await prisma.student.findUnique({ where: { rfidTag } });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found with this tag' });
    if (!student.isActive) return res.status(403).json({ success: false, error: 'Student account is inactive' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await prisma.boardingLog.findFirst({
      where: { studentId: student.id, busId: Number(busId), boardedAt: { gte: today }, status: 'Boarded' }
    });

    if (existingLog) {
      return res.status(400).json({ success: false, error: 'Student already boarded this bus today.' });
    }

    const log = await prisma.boardingLog.create({
      data: {
        studentId: student.id,
        busId: Number(busId),
        locationName,
        status: 'Boarded'
      },
      include: {
        student: { select: { fullName: true, studentId: true, rollNumber: true } },
        bus: { select: { busNumber: true } }
      }
    });

    const io = req.app.get('io');
    if (io) io.emit('newBoarding', log);

    res.json({
      success: true,
      action: 'BOARDED',
      student: { name: student.fullName, rollNumber: student.rollNumber },
      time: new Date().toLocaleTimeString(),
      bus: log.bus.busNumber
    });
  } catch (error) {
    console.error('RFID Bus Scan Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
