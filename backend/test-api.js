const token = "put_token_here_if_needed"; // Actually we can just query the DB directly to test the Prisma logic.

const prisma = require('./prismaClient');

async function test() {
  const adminFilter = { adminId: 1 }; // assuming adminId 1
  const targetStart = new Date("2026-06-07T00:00:00.000Z");
  const targetEnd = new Date("2026-06-07T23:59:59.999Z");

  const rfidLogs = await prisma.attendance.findMany({
    where: {
      date: { gte: targetStart, lte: targetEnd },
      status: { not: 'absent' },
      student: { ...adminFilter, isActive: true }
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      student: {
        select: { fullName: true, studentId: true, profileImage: true }
      }
    }
  });

  console.log(JSON.stringify(rfidLogs, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
