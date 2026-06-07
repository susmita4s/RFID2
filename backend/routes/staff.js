const express = require('express');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('./auth');
const { checkPermission } = require('../middleware/rbac');
const prisma = require('../prismaClient');

const router = express.Router();

// ── GET /api/staff ────────────────────────────────────────────────────────────
// List all staff members
router.get('/', verifyToken, checkPermission('canAccessStaffManagement'), async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: 'staff' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        staffRole: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    const staffList = staff.map(s => ({ ...s, isActive: s.isVerified }));
    res.json({ success: true, staff: staffList });
  } catch (error) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
});

// ── POST /api/staff ───────────────────────────────────────────────────────────
// Create a new staff member (Admin only)
router.post('/', verifyToken, checkPermission('canAccessStaffManagement'), async (req, res) => {
  const { firstName, lastName, email, phone, password, staffRole } = req.body;

  if (!firstName || !email || !password || !staffRole) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: 'staff',
        staffRole,
        isVerified: true, // Auto-verify when created by admin
        isEmailVerified: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        staffRole: true,
        isVerified: true
      }
    });

    res.status(201).json({ success: true, message: 'Staff created successfully', staff: { ...newStaff, isActive: newStaff.isVerified } });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff' });
  }
});

// ── PUT /api/staff/:id ────────────────────────────────────────────────────────
// Update staff member
router.put('/:id', verifyToken, checkPermission('canAccessStaffManagement'), async (req, res) => {
  const staffId = Number(req.params.id);
  const { firstName, lastName, phone, staffRole, isActive } = req.body;

  try {
    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: {
        firstName,
        lastName,
        phone,
        staffRole,
        isVerified: isActive !== undefined ? isActive : undefined
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        staffRole: true,
        isVerified: true
      }
    });

    res.json({ success: true, message: 'Staff updated successfully', staff: { ...updatedStaff, isActive: updatedStaff.isVerified } });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
});

module.exports = router;
