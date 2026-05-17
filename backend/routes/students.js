const express = require('express');
const crypto  = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth');
const { parseISO, startOfDay, addMinutes } = require('date-fns');
const multer = require('multer');
const { storage } = require('../cloudinary');
const { sendActivationEmail } = require('../mailer');
const upload = multer({ storage });

const router = express.Router();
const prisma = new PrismaClient();

// ── Helper: Generate secure activation token ──────────────────────────────────
const generateActivationToken = () => crypto.randomBytes(32).toString('hex');

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
router.post('/create', verifyToken, upload.single('profileImage'), async (req, res) => {
  const { fullName, email, phoneNumber, gender, className, guardianName, rfidTag, joinedDate } = req.body;
  const profileImage = req.file ? req.file.path : null;

  if (!fullName || !email || !phoneNumber || !className) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Generate STU-YYYY-XXX
    const year = new Date().getFullYear();
    
    // Fetch the last created student ID for this year to properly increment
    const lastStudent = await prisma.student.findFirst({
      where: { studentId: { startsWith: `STU-${year}-` } },
      orderBy: { studentId: 'desc' }
    });
    
    let nextNum = 1;
    if (lastStudent && lastStudent.studentId) {
      const parts = lastStudent.studentId.split('-');
      if (parts.length === 3 && !isNaN(parts[2])) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    
    const studentIdStr = `STU-${year}-${String(nextNum).padStart(3, '0')}`;
    
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
          status: 'active',
          profileImage
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

    // ── Trigger Parent Account Activation Flow ────────────────────────────────
    // Only send activation if a parent email was provided
    if (email) {
      try {
        // Check if parent User already exists for this email
        let parentUser = await prisma.user.findUnique({ where: { email } });

        if (!parentUser) {
          // Create new INACTIVE parent account — no password yet
          const activationToken  = generateActivationToken();
          const activationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          parentUser = await prisma.user.create({
            data: {
              firstName: guardianName ? guardianName.split(' ')[0] : 'Parent',
              lastName:  guardianName ? guardianName.split(' ').slice(1).join(' ') : '',
              email,
              password:  '',       // No password until they set it via activation link
              role:      'parent',
              isVerified: false,   // Inactive until password is set
              isFirstLogin: true,
              activationToken,
              activationExpiry
            }
          });

          // Link parent User to student
          await prisma.student.update({
            where: { id: student.id },
            data:  { userId: parentUser.id }
          });

          // Build and send activation email
          const frontendUrl    = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
          const activationLink = `${frontendUrl}/parent/set-password?token=${activationToken}`;

          const emailResult = await sendActivationEmail(
            email,
            guardianName || 'Parent',
            fullName,
            activationLink
          );

          if (!emailResult.success) {
            console.warn(`⚠️ Activation email could not be sent to ${email}:`, emailResult.error);
          } else {
            console.log(`✅ Parent activation email dispatched to ${email}`);
          }

          // In dev mode, expose the link in the response for easy testing
          if (process.env.NODE_ENV !== 'production') {
            return res.status(201).json({
              success: true,
              message: 'Student registered successfully. Parent activation email sent.',
              student,
              _devActivationLink: activationLink
            });
          }
        } else if (parentUser.isVerified) {
          // Parent already has an active account — but user wants the flow to happen every time.
          // So we mark them unverified, generate a new token, and send the email.
          const activationToken  = generateActivationToken();
          const activationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

          await prisma.user.update({
            where: { email },
            data:  { 
                firstName: guardianName ? guardianName.split(' ')[0] : 'Parent',
                lastName:  guardianName ? guardianName.split(' ').slice(1).join(' ') : '',
                isVerified: false,
                activationToken, 
                activationExpiry 
            }
          });

          await prisma.student.update({
            where: { id: student.id },
            data:  { userId: parentUser.id }
          });

          const frontendUrl    = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
          const activationLink = `${frontendUrl}/parent/set-password?token=${activationToken}`;

          await sendActivationEmail(email, guardianName || 'Parent', fullName, activationLink);
          
          console.log(`ℹ️ Parent account reset for ${email} to enforce activation flow. Student linked.`);
        } else {
          // Parent exists but not yet activated — resend activation
          const activationToken  = generateActivationToken();
          const activationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

          await prisma.user.update({
            where: { email },
            data:  { 
                firstName: guardianName ? guardianName.split(' ')[0] : 'Parent',
                lastName:  guardianName ? guardianName.split(' ').slice(1).join(' ') : '',
                activationToken, 
                activationExpiry 
            }
          });

          await prisma.student.update({
            where: { id: student.id },
            data:  { userId: parentUser.id }
          });

          const frontendUrl    = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
          const activationLink = `${frontendUrl}/parent/set-password?token=${activationToken}`;

          await sendActivationEmail(email, guardianName || 'Parent', fullName, activationLink);

          if (process.env.NODE_ENV !== 'production') {
            return res.status(201).json({
              success: true,
              message: 'Student registered. Parent activation email resent.',
              student,
              _devActivationLink: activationLink
            });
          }
        }
      } catch (parentErr) {
        // Parent activation failure must NOT block the student creation response
        console.error('⚠️ Parent activation flow error (non-fatal):', parentErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.status(201).json({ success: true, message: 'Student registered successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || '';
      if (target.includes('email') || target.includes('parentEmail')) {
        return res.status(409).json({ success: false, message: 'Email is already registered.' });
      }
      if (target.includes('rfidTag')) {
        return res.status(409).json({ success: false, message: 'RFID Tag is already assigned to another user.' });
      }
      return res.status(409).json({ success: false, message: 'A duplicate record exists (Email, RFID, or ID).' });
    }
    res.status(500).json({ success: false, message: 'Failed to create student.' });
  }
});

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const existing = await prisma.student.findUnique({ where: { id: studentId } });
    
    if (!existing || existing.adminId !== req.user.id) {
       return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const data = { ...req.body };
    if (req.file) {
      data.profileImage = req.file.path;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const stu = await tx.student.update({
        where: { id: studentId },
        data,
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

    await prisma.student.delete({
      where: { id: studentId }
    });

    res.json({ success: true, message: 'Student deleted permanently from database.' });
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
