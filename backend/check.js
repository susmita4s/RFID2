/**
 * check.js — Database diagnostic tool
 * Run with: node check.js
 * Prints a summary of all records in every table.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('\n📊 RFID Database Health Check');
  console.log('═══════════════════════════════════════');

  try {
    // ── Users ────────────────────────────────────────────────────────────────
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    console.log(`\n👤 Users (${users.length} total):`);
    users.forEach(u => console.log(`   [${u.role.toUpperCase()}] ${u.name} — ${u.email}`));

    // ── Students ─────────────────────────────────────────────────────────────
    const students = await prisma.student.findMany({
      select: { id: true, name: true, rollNumber: true, class: true, section: true, rfidTag: true, isActive: true },
    });
    console.log(`\n🎓 Students (${students.length} total):`);
    students.forEach(s =>
      console.log(`   [${s.rollNumber}] ${s.name} — Class ${s.class}-${s.section} | RFID: ${s.rfidTag ?? 'N/A'} | Active: ${s.isActive}`)
    );

    // ── Attendance ────────────────────────────────────────────────────────────
    const attendance = await prisma.attendance.findMany();
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount  = attendance.filter(a => a.status === 'absent').length;
    console.log(`\n📋 Attendance (${attendance.length} records): ${presentCount} present, ${absentCount} absent`);

    // ── Bus Logs ──────────────────────────────────────────────────────────────
    const busLogs = await prisma.busLog.findMany();
    console.log(`\n🚌 Bus Logs (${busLogs.length} records)`);

    // ── Library Logs ──────────────────────────────────────────────────────────
    const libraryLogs = await prisma.libraryLog.findMany();
    const borrowed  = libraryLogs.filter(l => l.action === 'borrowed').length;
    const returned  = libraryLogs.filter(l => l.action === 'returned').length;
    console.log(`\n📚 Library Logs (${libraryLogs.length} records): ${borrowed} borrowed, ${returned} returned`);

    // ── Payments ──────────────────────────────────────────────────────────────
    const payments = await prisma.payment.findMany();
    const paid    = payments.filter(p => p.status === 'paid').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    console.log(`\n💰 Payments (${payments.length} records): ${paid} paid, ${pending} pending, ${overdue} overdue`);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Database check complete — all tables are accessible.\n');

  } catch (error) {
    console.error('\n❌ Database check failed!');
    console.error('   Error:', error.message);
    console.error('\n   Make sure you have run:');
    console.error('   1. npx prisma db push');
    console.error('   2. node seed.js\n');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
