const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFees() {
  console.log('Seeding fees...');
  try {
    const students = await prisma.student.findMany();
    if (students.length === 0) {
      console.log('No students found. Run seed.js after fixing it.');
      return;
    }
    
    await prisma.feeTransaction.deleteMany();
    for (const student of students) {
      await prisma.feeTransaction.createMany({
        data: [
          { studentId: student.id, amount: 5000, paymentType: 'Cash', description: 'Q1 Tuition Fee', status: 'Completed' },
          { studentId: student.id, amount: 1500, paymentType: 'Online', description: 'Bus Fee April', status: 'Pending' },
        ],
      });
    }
    console.log('Successfully seeded FeeTransactions!');
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
seedFees();
