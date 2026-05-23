const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, role: true, schoolId: true }
    });
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error querying users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
