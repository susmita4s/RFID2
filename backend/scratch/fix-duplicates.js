const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicates() {
  const students = await prisma.student.findMany({
    where: {
      email: 'himanshudey26@gmail.com'
    }
  });

  console.log(`Found ${students.length} students with duplicate email.`);
  
  for (let i = 1; i < students.length; i++) {
    const student = students[i];
    const newEmail = `himanshudey26+${student.id}@gmail.com`;
    console.log(`Updating student ${student.id} (${student.fullName}) email to ${newEmail}`);
    await prisma.student.update({
      where: { id: student.id },
      data: { email: newEmail }
    });
  }

  console.log('Done fixing duplicates.');
  await prisma.$disconnect();
}

fixDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
