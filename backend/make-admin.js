/**
 * make-admin.js — Promote a user to admin role
 * Usage: node make-admin.js <email>
 * Example: node make-admin.js john@school.com
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('\n❌ Usage: node make-admin.js <email>');
    console.error('   Example: node make-admin.js john@school.com\n');
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Looking up user: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      console.error('   Make sure the user has registered first.\n');
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  "${user.name}" (${email}) is already an admin. No changes made.\n`);
      process.exit(0);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data:  { role: 'admin' },
    });

    console.log('✅ Success! Admin role granted.');
    console.log('─────────────────────────────────');
    console.log(`   Name  : ${updatedUser.name}`);
    console.log(`   Email : ${updatedUser.email}`);
    console.log(`   Role  : ${updatedUser.role}`);
    console.log('─────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Failed to update user role:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
