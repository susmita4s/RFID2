const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const students = await prisma.student.findMany();
  const userIdCounts = {};
  students.forEach(s => {
    if (s.userId) {
      userIdCounts[s.userId] = (userIdCounts[s.userId] || 0) + 1;
    }
  });

  const duplicates = Object.keys(userIdCounts).filter(id => userIdCounts[id] > 1);
  console.log('Duplicate userIds:', duplicates);
  
  for (const userId of duplicates) {
    const studentList = students.filter(s => s.userId == userId);
    console.log(`Students with userId ${userId}:`, studentList.map(s => ({ id: s.id, name: s.fullName })));
  }

  await prisma.$disconnect();
}

checkDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
