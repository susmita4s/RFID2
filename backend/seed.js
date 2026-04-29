const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // ── Clean existing data ──────────────────────────────────────────────────
    await prisma.session.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.libraryLog.deleteMany();
    await prisma.busLog.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();
    console.log('🗑️  Cleared existing data');

    // ── Create Admin User ────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: 'admin@school.com',
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log('✅ Created admin:', admin.email);

    // ── Create Demo Teacher ──────────────────────────────────────────────────
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    await prisma.user.create({
      data: {
        name: 'John Teacher',
        email: 'teacher@school.com',
        password: teacherPassword,
        role: 'user',
      },
    });
    console.log('✅ Created teacher: teacher@school.com');

    // ── Create Demo Students ─────────────────────────────────────────────────
    const studentsData = [
      { name: 'Alice Johnson',  rollNumber: 'S001', class: '10', section: 'A', rfidTag: 'RFID001', parentPhone: '9876543210', parentEmail: 'parent1@example.com' },
      { name: 'Bob Smith',      rollNumber: 'S002', class: '10', section: 'A', rfidTag: 'RFID002', parentPhone: '9876543211', parentEmail: 'parent2@example.com' },
      { name: 'Carol White',    rollNumber: 'S003', class: '9',  section: 'B', rfidTag: 'RFID003', parentPhone: '9876543212', parentEmail: 'parent3@example.com' },
      { name: 'David Brown',    rollNumber: 'S004', class: '9',  section: 'B', rfidTag: 'RFID004', parentPhone: '9876543213', parentEmail: 'parent4@example.com' },
      { name: 'Eva Davis',      rollNumber: 'S005', class: '8',  section: 'C', rfidTag: 'RFID005', parentPhone: '9876543214', parentEmail: 'parent5@example.com' },
    ];

    const students = await Promise.all(
      studentsData.map(data => prisma.student.create({ data }))
    );
    console.log(`✅ Created ${students.length} students`);

    // ── Create Attendance Records ─────────────────────────────────────────────
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const student of students) {
      await prisma.attendance.createMany({
        data: [
          { studentId: student.id, date: today,     status: 'present', checkIn: new Date() },
          { studentId: student.id, date: yesterday, status: 'present', checkIn: new Date(yesterday.setHours(8, 30)) },
        ],
      });
    }
    console.log('✅ Created attendance records');

    // ── Create Bus Logs ───────────────────────────────────────────────────────
    for (const student of students.slice(0, 3)) {
      await prisma.busLog.create({
        data: { studentId: student.id, action: 'boarded', busRoute: 'Route-A', location: 'Main Gate' },
      });
    }
    console.log('✅ Created bus logs');

    // ── Create Library Logs ───────────────────────────────────────────────────
    await prisma.libraryLog.createMany({
      data: [
        { studentId: students[0].id, bookTitle: 'Mathematics Class 10', bookId: 'LIB001', action: 'borrowed', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        { studentId: students[1].id, bookTitle: 'Science Encyclopedia',  bookId: 'LIB002', action: 'borrowed', dueDate: new Date(Date.now() + 7  * 24 * 60 * 60 * 1000) },
      ],
    });
    console.log('✅ Created library logs');

    // ── Create Payments ───────────────────────────────────────────────────────
    for (const student of students) {
      await prisma.payment.createMany({
        data: [
          { studentId: student.id, amount: 5000, type: 'tuition',  description: 'Q1 Tuition Fee', status: 'paid',    paidAt: new Date() },
          { studentId: student.id, amount: 1500, type: 'bus',      description: 'Bus Fee April',  status: 'pending', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
        ],
      });
    }
    console.log('✅ Created payment records');

    console.log('\n🎉 Database seeded successfully!');
    console.log('─────────────────────────────────');
    console.log('Admin Login  → admin@school.com   / admin123');
    console.log('Teacher Login→ teacher@school.com / teacher123');
    console.log('─────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
