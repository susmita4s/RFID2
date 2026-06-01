const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const student = await prisma.student.findFirst({
      where: {
        rfid_uid: "test"
      }
    });
    console.log("Success");
  } catch(err) {
    console.error("Prisma error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
