const express = require('express');
const crypto  = require('crypto');
const { verifyToken } = require('./auth');
const { checkPermission } = require('../middleware/rbac');
const { parseISO, startOfDay, addMinutes } = require('date-fns');
const multer = require('multer');
const { storage } = require('../cloudinary');
const { sendActivationEmail } = require('../mailer');
const upload = multer({ storage });

const router = express.Router();
const prisma = require('../prismaClient');
// ── Helper: Generate secure activation token ──────────────────────────────────
const generateActivationToken = () => crypto.randomBytes(32).toString('hex');

// Helper to convert frontend date string to safe local midnight DB date
const convertToLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  let str = String(dateStr).trim().replace(/\//g, '-');
  const parts = str.split('-');
  
  if (parts.length === 3) {
    let year, month, day;
    
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY
      year = parseInt(parts[2], 10);
      let p0 = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      if (p1 > 12) {
        month = p0; // MM-DD-YYYY
        day = p1;
      } else {
        day = p0; // Default to DD-MM-YYYY
        month = p1;
      }
    } else {
      // DD-MM-YY
      let p0 = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      let p2 = parseInt(parts[2], 10);
      year = p2 < 100 ? 2000 + p2 : p2;
      day = p0;
      month = p1;
    }
    
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  
  // Fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

// ── GET /api/students ─────────────────────────────────────────────────────────
router.get('/', verifyToken, checkPermission('canAccessStudents'), async (req, res) => {
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
router.get('/:id', verifyToken, checkPermission('canAccessStudents'), async (req, res) => {
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
async function registerSingleStudent({
  fullName, email, phoneNumber, gender, className, guardianName, rfidTag, joinedDate, profileImage
}, adminId, reqInfo) {
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
          adminId: adminId,
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
          const frontendUrl = reqInfo.frontendUrl;
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

          const frontendUrl = reqInfo.frontendUrl;
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

          const frontendUrl = reqInfo.frontendUrl;
          const activationLink = `${frontendUrl}/parent/set-password?token=${activationToken}`;

          await sendActivationEmail(email, guardianName || 'Parent', fullName, activationLink);
        }
      } catch (parentErr) {
        // Parent activation failure must NOT block the student creation response
        console.error('⚠️ Parent activation flow error (non-fatal):', parentErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    return { success: true, student };
  } catch (error) {
    console.error('Create student error:', error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || '';
      let msg = 'A duplicate record exists (Email, RFID, or ID).';
      if (target.includes('email') || target.includes('parentEmail')) {
        msg = 'Email is already registered.';
      } else if (target.includes('rfidTag')) {
        msg = 'RFID Tag is already assigned to another user.';
      }
      throw new Error(msg);
    }
    throw new Error('Failed to create student.');
  }
}

router.post('/create', verifyToken, checkPermission('canAccessStudents'), upload.single('profileImage'), async (req, res) => {
  const { fullName, email, phoneNumber, gender, className, guardianName, rfidTag, joinedDate } = req.body;
  const profileImage = req.file ? req.file.path : null;

  if (!fullName || !email || !phoneNumber || !className) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await registerSingleStudent({
      fullName, email, phoneNumber, gender, className, guardianName, rfidTag, joinedDate, profileImage
    }, req.user.id, { frontendUrl });
    
    res.status(201).json({ success: true, message: 'Student registered successfully', student: result.student });
  } catch (error) {
    res.status(error.message.includes('duplicate') || error.message.includes('already') ? 409 : 500)
       .json({ success: false, message: error.message });
  }
});

// ── POST /api/students/import ─────────────────────────────────────────────────
router.post('/import', verifyToken, checkPermission('canAccessStudents'), async (req, res) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ success: false, message: 'Invalid payload.' });
  }

  const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  let successCount = 0;
  let failedCount = 0;
  let duplicateCount = 0;
  const failedRows = [];
  
  for (const [index, studentData] of students.entries()) {
    try {
      let rfidToAssign = studentData.rfidTag;
      if (!rfidToAssign) {
        // Auto generate RFID
        let isUnique = false;
        while (!isUnique) {
          const randomHex = Math.random().toString(16).toUpperCase().substring(2, 6);
          rfidToAssign = `RFID-${randomHex}`;
          const existing = await prisma.student.findUnique({ where: { rfidTag: rfidToAssign } });
          if (!existing) isUnique = true;
        }
      }

      let profileImage = studentData.profileImage;
      if (profileImage && profileImage.startsWith('http')) {
        try {
          const { cloudinary } = require('../cloudinary');
          const uploadRes = await cloudinary.uploader.upload(profileImage, { folder: 'student_profiles' });
          profileImage = uploadRes.secure_url;
        } catch (imgErr) {
          console.warn(`Could not upload image for ${studentData.fullName}:`, imgErr.message);
          profileImage = null; // Proceed without image
        }
      }

      await registerSingleStudent({
        ...studentData,
        rfidTag: rfidToAssign,
        profileImage
      }, req.user.id, { frontendUrl });
      
      successCount++;
    } catch (error) {
      failedCount++;
      if (error.message.includes('already') || error.message.includes('duplicate')) {
        duplicateCount++;
      }
      failedRows.push({
        row: index + 1,
        name: studentData.fullName,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    total: students.length,
    successCount,
    failedCount,
    duplicateCount,
    failedRows
  });
});

// ── PUT /api/students/:id ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, checkPermission('canAccessStudents'), upload.single('profileImage'), async (req, res) => {
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
router.patch('/:id/status', verifyToken, checkPermission('canAccessStudents'), async (req, res) => {
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
router.delete('/:id', verifyToken, checkPermission('canAccessStudents'), async (req, res) => {
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
router.post('/assign-rfid', verifyToken, checkPermission('canAccessStudents'), async (req, res) => {
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
