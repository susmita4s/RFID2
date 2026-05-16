const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserIdDuplicates() {
  const students = await prisma.student.findMany({
    where: {
      userId: 8
    }
  });

  console.log(`Found ${students.length} students with duplicate userId 8.`);
  
  for (let i = 1; i < students.length; i++) {
    const student = students[i];
    console.log(`Updating student ${student.id} (${student.fullName}) userId to null`);
    await prisma.student.update({
      where: { id: student.id },
      data: { userId: null }
    });
  }

  console.log('Done fixing userId duplicates.');
  await prisma.$disconnect();
}

fixUserIdDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
