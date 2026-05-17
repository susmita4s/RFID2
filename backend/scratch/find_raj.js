const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const student = await prisma.student.findFirst({
      where: { fullName: { contains: 'Raj Aryan' } },
      include: { rfidWallet: true, user: true }
    });
    console.log('Student Info:', student);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
