const { PrismaClient } = require('@prisma/client');

// Create a single shared instance of PrismaClient
const prisma = new PrismaClient();

module.exports = prisma;
