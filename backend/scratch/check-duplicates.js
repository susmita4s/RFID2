const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const students = await prisma.student.findMany();
  const emailCounts = {};
  students.forEach(s => {
    if (s.email) {
      emailCounts[s.email] = (emailCounts[s.email] || 0) + 1;
    }
  });

  const duplicates = Object.keys(emailCounts).filter(email => emailCounts[email] > 1);
  console.log('Duplicate emails:', duplicates);
  
  for (const email of duplicates) {
    const studentList = students.filter(s => s.email === email);
    console.log(`Students with email ${email}:`, studentList.map(s => ({ id: s.id, name: s.fullName })));
  }

  await prisma.$disconnect();
}

checkDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
