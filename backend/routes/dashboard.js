const express = require('express');
const { verifyToken } = require('./auth');
const { startOfDay, endOfDay } = require('date-fns');

const router = express.Router();
const prisma = require('../prismaClient');
// ── GET /api/dashboard/stats ──────────────────────────────────────────────────
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const todayStr = req.query.date; // e.g. "2026-05-13"
    let todayStart, todayEnd;

    if (todayStr) {
      const [year, month, day] = todayStr.split('-');
      const dateObj = new Date(year, month - 1, day);
      todayStart = startOfDay(dateObj);
      todayEnd = endOfDay(dateObj);
    } else {
      const now = new Date();
      todayStart = startOfDay(now);
      todayEnd = endOfDay(now);
    }

    // We only count data belonging to this admin
    const adminFilter = req.user.role === 'admin' ? { adminId: req.user.id } : {};
    
    // Total Students
    const totalStudents = await prisma.student.count({
      where: { ...adminFilter, isActive: true }
    });

    // Attendance Today
    const attendanceToday = await prisma.attendance.count({
      where: {
        student: { ...adminFilter, isActive: true },
        date: {
          gte: todayStart,
          lte: todayEnd
        },
        status: { not: 'absent' }
      }
    });

    // Library Today (borrowed or returned today)
    const libraryToday = await prisma.libraryLog.count({
      where: {
        student: adminFilter,
        OR: [
          { borrowedAt: { gte: todayStart, lte: todayEnd } },
          { returnedAt: { gte: todayStart, lte: todayEnd } }
        ]
      }
    });

    const libraryPending = await prisma.libraryLog.count({
      where: {
        student: adminFilter,
        action: 'borrowed',
        returnedAt: null
      }
    });

    // Bus Load Today (Boarded today)
    const busLoad = await prisma.boardingLog.count({
      where: {
        bus: adminFilter,
        boardedAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        attendanceToday,
        libraryToday,
        libraryPending,
        busLoad
      }
    });

  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
});

// ── GET /api/dashboard/activities ─────────────────────────────────────────────
router.get('/activities', verifyToken, async (req, res) => {
  try {
    const adminFilter = req.user.role === 'admin' ? { adminId: req.user.id } : {};

    const dateStr = req.query.date;
    let targetStart, targetEnd;

    if (dateStr) {
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(year, month - 1, day);
      targetStart = startOfDay(dateObj);
      targetEnd = endOfDay(dateObj);
    } else {
      const now = new Date();
      targetStart = startOfDay(now);
      targetEnd = endOfDay(now);
    }

    // Fetch latest 5 unique student attendance records for the target date that are NOT absent
    const rfidLogs = await prisma.attendance.findMany({
      where: {
        date: { gte: targetStart, lte: targetEnd },
        status: { not: 'absent' },
        student: { ...adminFilter, isActive: true }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        student: {
          select: { fullName: true, studentId: true, profileImage: true }
        }
      }
    });

    const formattedRfid = rfidLogs.map(log => {
      // Determine if the last action was an Entry or Exit
      const isExit = log.checkOut && (!log.checkIn || new Date(log.checkOut) > new Date(log.checkIn));
      const type = isExit ? 'Exit' : 'Entry';
      const time = isExit ? log.checkOut : log.checkIn;

      return {
        id: log.id,
        studentName: log.student?.fullName || 'Unknown Student',
        studentId: log.student?.studentId || 'N/A',
        type: type,
        time: time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        img: log.student?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.student?.fullName || 'U')}&background=random`,
        isActive: type === 'Entry'
      };
    });

    // Fetch latest 5 Library logs for the target date
    const libraryLogs = await prisma.libraryLog.findMany({
      where: { 
        student: { 
          ...adminFilter,
          isActive: true 
        },
        OR: [
          { borrowedAt: { gte: targetStart, lte: targetEnd } },
          { returnedAt: { gte: targetStart, lte: targetEnd } }
        ]
      },
      orderBy: { id: 'desc' },
      take: 5,
      include: {
        student: {
          select: { fullName: true, studentId: true, profileImage: true }
        }
      }
    });

    const formattedLibrary = libraryLogs.map(log => {
      const isReturned = !!log.returnedAt;
      const type = isReturned ? 'Returned' : 'Borrowed';
      const time = isReturned ? log.returnedAt : log.borrowedAt;
      
      return {
        id: log.id,
        studentName: log.student?.fullName || 'Unknown Student',
        studentId: log.student?.studentId || 'N/A',
        type: type,
        time: time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        img: log.student?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(log.student?.fullName || 'U')}&background=random`,
        isActive: !isReturned
      };
    });

    res.json({
      success: true,
      data: {
        rfidActivity: formattedRfid,
        libraryLogs: formattedLibrary
      }
    });

  } catch (error) {
    console.error('Fetch dashboard activities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard activities.' });
  }
});

module.exports = router;

