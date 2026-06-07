const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Middleware to check if the user has a specific permission.
 * Assumes req.user is populated by verifyToken middleware.
 * @param {string} permissionField - The field name in RolePermission to check.
 */
const checkPermission = (permissionField) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Admin has access to everything
      if (req.user.role === 'admin' || req.user.role === 'administrator') {
        return next();
      }

      // Parents or Users might not have permissions handled by this middleware
      if (req.user.role !== 'staff') {
        return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to staff/admin' });
      }

      // Staff permissions check
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { staffRole: true }
      });

      if (!user || !user.staffRole) {
        return res.status(403).json({ success: false, message: 'Forbidden: Staff role not assigned' });
      }

      const permissions = await prisma.rolePermission.findUnique({
        where: { roleName: user.staffRole }
      });

      if (!permissions || !permissions[permissionField]) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this module' });
      }

      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error during permission check' });
    }
  };
};

module.exports = { checkPermission };
