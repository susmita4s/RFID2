const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const studentId = 42;
    const activities = await prisma.studentActivity.findMany({
      where: { studentId }
    });
    const attendances = await prisma.attendance.findMany({
      where: { studentId },
      include: { activities: true }
    });
    const boardingLogs = await prisma.boardingLog.findMany({
      where: { studentId },
      include: { bus: true }
    });
    const libraryIssues = await prisma.libraryIssue.findMany({
      where: { studentId },
      include: { book: true }
    });
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { studentId }
    });
    
    console.log('--- ACTIVITIES ---', activities);
    console.log('--- ATTENDANCE ---', attendances);
    console.log('--- BOARDING ---', boardingLogs);
    console.log('--- LIBRARY ---', libraryIssues);
    console.log('--- WALLET TRANSACTIONS ---', walletTransactions);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
