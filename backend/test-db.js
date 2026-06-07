const prisma = require('./prismaClient');

async function test() {
  const attendance = await prisma.attendance.findMany({
    where: { status: { not: 'absent' } },
    include: { student: true }
  });
  console.log(JSON.stringify(attendance, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
