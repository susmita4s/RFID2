const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('./auth'); // Assuming verifyToken is exported from auth.js

const router = express.Router();


const prisma = new PrismaClient();

// Get all roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const schoolId = req.user.schoolId || null;
    const roles = await prisma.rolePermission.findMany({
      where: {
        OR: [
          { schoolId: schoolId },
          { schoolId: null }
        ]
      }
    });
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
});

// Add a new role
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admin can add roles' });
  }

  const { roleName, canAccessDashboard, canAccessLibrary, canAccessPayments, canAccessStudents, canAccessAttendance, canAccessBus } = req.body;

  if (!roleName) {
    return res.status(400).json({ success: false, message: 'Role name is required' });
  }

  try {
    const newRole = await prisma.rolePermission.create({
      data: {
        roleName,
        canAccessDashboard: canAccessDashboard !== undefined ? canAccessDashboard : true,
        canAccessLibrary: canAccessLibrary || false,
        canAccessPayments: canAccessPayments || false,
        canAccessStudents: canAccessStudents || false,
        canAccessAttendance: canAccessAttendance || false,
        canAccessBus: canAccessBus || false,
        schoolId: req.user.schoolId || null
      }
    });
    res.status(201).json({ success: true, role: newRole });
  } catch (error) {
    console.error('Error adding role:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Role name already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to add role' });
  }
});

// Update role permissions
router.put('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admin can update roles' });
  }

  const roleId = parseInt(req.params.id);
  const { canAccessDashboard, canAccessLibrary, canAccessPayments, canAccessStudents, canAccessAttendance, canAccessBus } = req.body;

  try {
    const updatedRole = await prisma.rolePermission.update({
      where: { id: roleId },
      data: {
        canAccessDashboard,
        canAccessLibrary,
        canAccessPayments,
        canAccessStudents,
        canAccessAttendance,
        canAccessBus
      }
    });
    res.json({ success: true, role: updatedRole });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
});

// Delete a role
router.delete('/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admin can delete roles' });
  }

  const roleId = parseInt(req.params.id);

  try {
    await prisma.rolePermission.delete({
      where: { id: roleId }
    });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: 'Failed to delete role' });
  }
});

module.exports = router;
