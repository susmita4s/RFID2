const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  const email = 'hdey1381@gmail.com';
  // I don't know the password, but I can check if finding the user works.
  try {
    console.log('Finding user...');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User found:', user.email);
    
    console.log('Testing include school...');
    const userWithSchool = await prisma.user.findUnique({
      where: { id: user.id },
      include: { school: true }
    });
    console.log('User with school:', JSON.stringify(userWithSchool, null, 2));
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
