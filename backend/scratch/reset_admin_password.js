const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin@1234';
    const hashed = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { email: 'hdey1381@gmail.com' },
      data: { password: hashed, isVerified: true }
    });

    console.log('✅ Password reset successful!');
    console.log('----------------------------');
    console.log('Email   :', updated.email);
    console.log('Name    :', updated.firstName, updated.lastName);
    console.log('Role    :', updated.role);
    console.log('Password: Admin@1234');
    console.log('----------------------------');
    console.log('You can now login at http://localhost:3000');
  } catch (err) {
    console.log('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
