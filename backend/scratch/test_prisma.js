const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const url1 = process.env.DATABASE_URL;
const url2 = `${process.env.DATABASE_URL}?sslaccept=strict`;
const url3 = `${process.env.DATABASE_URL}?sslcert=`;

async function testConnection(url, name) {
  console.log(`Testing ${name}...`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Success: ${name} connected!`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${name} - ${error.message.split('\n')[0]}`);
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  const success1 = await testConnection(url1, 'Original URL');
  if (!success1) {
    const success2 = await testConnection(url2, 'URL with ?sslaccept=strict');
    if (!success2) {
      await testConnection(url3, 'URL with ?sslcert=');
    }
  }
}

run();
