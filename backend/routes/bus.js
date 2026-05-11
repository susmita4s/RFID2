const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to get socket.io instance
const getIo = (req) => req.app.get('io');

// ── 1. GET ALL BUSES ──────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        _count: {
          select: { boardingLogs: { where: { status: 'Boarded' } } }
        }
      },
      orderBy: { busNumber: 'asc' }
    });
    
    const formattedBuses = buses.map(bus => ({
      ...bus,
      activeStudents: bus._count.boardingLogs
    }));
    
    res.json({ success: true, buses: formattedBuses });
  } catch (error) {
    console.error('Fetch buses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch buses' });
  }
});

// ── 2. GET LIVE BOARDING ACTIVITY ─────────────────────────────────────────────
router.get('/boarding-activity', verifyToken, async (req, res) => {
  try {
    // Only get today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logs = await prisma.boardingLog.findMany({
      where: { boardedAt: { gte: today } },
      include: {
        student: { select: { fullName: true, studentId: true, rollNumber: true, phoneNumber: true } },
        bus: { select: { busNumber: true } }
      },
      orderBy: { boardedAt: 'desc' },
      take: 50 // Limit to latest 50 for performance
    });
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Fetch boarding logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch boarding activity' });
  }
});

// ── 3. CREATE BOARDING ENTRY (MANUAL) ─────────────────────────────────────────
router.post('/board-student', verifyToken, async (req, res) => {
  const { studentDbId, busId, locationName } = req.body;
  
  if (!studentDbId || !busId || !locationName) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prevent duplicate boarding for today
    const existingLog = await prisma.boardingLog.findFirst({
      where: { 
        studentId: studentDbId, 
        busId, 
        boardedAt: { gte: today },
        status: 'Boarded'
      }
    });

    if (existingLog) {
      return res.status(400).json({ success: false, error: 'Student is already boarded on this bus today.' });
    }

    const log = await prisma.boardingLog.create({
      data: {
        studentId: studentDbId,
        busId,
        locationName,
        status: 'Boarded'
      },
      include: {
        student: { select: { fullName: true, studentId: true, rollNumber: true } },
        bus: { select: { busNumber: true } }
      }
    });

    // Emit Real-Time Socket Event
    getIo(req).emit('newBoarding', log);

    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error('Boarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to create boarding entry' });
  }
});

// ── 4. LIVE BUS LOCATION UPDATE ───────────────────────────────────────────────
router.patch('/location/:id', verifyToken, async (req, res) => {
  const { currentLatitude, currentLongitude } = req.body;
  const busId = Number(req.params.id);

  try {
    const bus = await prisma.bus.update({
      where: { id: busId },
      data: { currentLatitude, currentLongitude }
    });

    getIo(req).emit('busLocationUpdate', { 
      busId: bus.id, 
      lat: currentLatitude, 
      lng: currentLongitude 
    });

    res.json({ success: true, bus });
  } catch (error) {
    console.error('Bus location update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bus location' });
  }
});

// ── 5. UPDATE BUS STATUS ──────────────────────────────────────────────────────
router.patch('/status/:id', verifyToken, async (req, res) => {
  const { status } = req.body;
  const busId = Number(req.params.id);

  try {
    const bus = await prisma.bus.update({
      where: { id: busId },
      data: { status }
    });

    getIo(req).emit('busStatusUpdate', { busId: bus.id, status });

    res.json({ success: true, bus });
  } catch (error) {
    console.error('Bus status update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update bus status' });
  }
});

// ── 6. GET SINGLE BUS DETAILS ─────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  const busId = Number(req.params.id);

  try {
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        boardingLogs: {
          where: { status: 'Boarded' },
          include: { student: { select: { fullName: true, rollNumber: true, phoneNumber: true } } }
        }
      }
    });

    if (!bus) return res.status(404).json({ success: false, error: 'Bus not found' });
    res.json({ success: true, bus });
  } catch (error) {
    console.error('Fetch single bus error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bus details' });
  }
});

// ── 7. DELETE BOARDING ENTRY ──────────────────────────────────────────────────
router.delete('/boarding/:id', verifyToken, async (req, res) => {
  const logId = Number(req.params.id);

  try {
    await prisma.boardingLog.delete({ where: { id: logId } });
    
    // Emit event so clients remove the log
    getIo(req).emit('boardingDeleted', { logId });

    res.json({ success: true, message: 'Boarding entry deleted' });
  } catch (error) {
    console.error('Delete boarding entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete entry' });
  }
});

module.exports = router;
