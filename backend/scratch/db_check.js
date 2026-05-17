const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    const studentCount = await prisma.student.count();
    console.log('Students in DB:', studentCount);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

check();
