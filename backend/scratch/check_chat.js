const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // Test raw insert and select
    await prisma.$executeRaw`
      INSERT INTO ChatMessage (senderId, senderRole, receiverId, chatType, message, isSeen, createdAt)
      VALUES (1, 'parent', 99, 'teacher_chat', 'Hello Test Message', false, NOW())
    `;
    const rows = await prisma.$queryRaw`SELECT * FROM ChatMessage`;
    console.log('ChatMessage rows:', rows);
    
    // Clean up
    await prisma.$executeRaw`DELETE FROM ChatMessage WHERE message = 'Hello Test Message'`;
    console.log('Cleaned up test message successfully!');
  } catch (err) {
    console.error('Error running chat test:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
