const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const students = await prisma.student.findMany();
  console.log('Students:', students.map(s => s.studentId).sort());
  
  const year = new Date().getFullYear();
  const count = await prisma.student.count({ where: { studentId: { startsWith: `STU-${year}-` } } });
  console.log(`Current Count for ${year}:`, count);
  console.log(`Next generated ID will be: STU-${year}-${String(count + 1).padStart(3, '0')}`);
  
  const nextId = `STU-${year}-${String(count + 1).padStart(3, '0')}`;
  const exists = students.find(s => s.studentId === nextId);
  console.log(`Will next ID clash?`, !!exists);
  
  await prisma.$disconnect();
}

check().catch(console.error);
