const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, isVerified: true, firstName: true, lastName: true }
    });
    console.log('Total users in DB:', users.length);
    users.forEach(u => {
      console.log(`  - ${u.email} | role: ${u.role} | verified: ${u.isVerified} | name: ${u.firstName} ${u.lastName}`);
    });
    
    const schools = await prisma.school.findMany({ select: { id: true, name: true } });
    console.log('\nTotal schools:', schools.length);
    schools.forEach(s => console.log(`  - ${s.id}: ${s.name}`));
  } catch (err) {
    console.log('❌ ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
