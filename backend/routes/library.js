const express = require('express');
const { verifyToken } = require('./auth');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();
const prisma = require('../prismaClient');
// ── GET /api/library ──────────────────────────────────────────────────────────
router.get('/', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    const { studentId, action, overdue } = req.query;

    const where = {};
    if (studentId) where.studentId = Number(studentId);
    if (action)    where.action    = action;
    if (overdue === 'true') {
      where.action     = 'borrowed';
      where.returnedAt = null;
      where.dueDate    = { lt: new Date() };
    }

    const logs = await prisma.libraryLog.findMany({
      where,
      include: { student: { select: { name: true, rollNumber: true, class: true } } },
      orderBy: { borrowedAt: 'desc' },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch library logs.' });
  }
});

// ── POST /api/library/borrow ──────────────────────────────────────────────────
router.post('/borrow', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  const { studentId, rfidTag, bookTitle, bookId, dueDays } = req.body;

  if (!bookTitle) return res.status(400).json({ error: 'Book title is required.' });

  try {
    let resolvedStudentId = studentId;

    if (!resolvedStudentId && rfidTag) {
      const student = await prisma.student.findUnique({ where: { rfidTag } });
      if (!student) return res.status(404).json({ error: 'No student found with this RFID tag.' });
      resolvedStudentId = student.id;
    }

    if (!resolvedStudentId) return res.status(400).json({ error: 'studentId or rfidTag is required.' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (dueDays || 14));

    const log = await prisma.libraryLog.create({
      data: { studentId: resolvedStudentId, bookTitle, bookId, action: 'borrowed', dueDate },
      include: { student: { select: { name: true, rollNumber: true } } },
    });

    res.status(201).json({ message: 'Book borrowed successfully.', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record borrow.' });
  }
});

// ── PUT /api/library/return/:id ───────────────────────────────────────────────
router.put('/return/:id', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    const log = await prisma.libraryLog.findUnique({ where: { id: Number(req.params.id) } });
    if (!log) return res.status(404).json({ error: 'Library record not found.' });

    const returnedAt = new Date();
    let fine = 0;
    if (log.dueDate && returnedAt > log.dueDate) {
      const daysLate = Math.ceil((returnedAt - log.dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 2; // ₹2 per day fine
    }

    const updated = await prisma.libraryLog.update({
      where: { id: Number(req.params.id) },
      data:  { action: 'returned', returnedAt, fine },
    });

    res.json({ message: 'Book returned successfully.', fine, log: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record return.' });
  }
});

// ── GET /api/library/overdue ──────────────────────────────────────────────────
router.get('/overdue', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    const overdueBooks = await prisma.libraryLog.findMany({
      where: { action: 'borrowed', returnedAt: null, dueDate: { lt: new Date() } },
      include: { student: { select: { name: true, rollNumber: true, parentPhone: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json(overdueBooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue books.' });
  }
});

// ── GET /api/library/stats ──────────────────────────────────────────────────
router.get('/stats', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    const totalInventoryObj = await prisma.book.aggregate({
      _sum: { totalCopies: true }
    });
    const totalInventory = totalInventoryObj._sum.totalCopies || 0;

    const activeIssues = await prisma.libraryIssue.count({
      where: { status: { in: ['issued', 'overdue'] } }
    });

    const overdueItems = await prisma.libraryIssue.count({
      where: { status: 'overdue' }
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const processedToday = await prisma.libraryIssue.count({
      where: { createdAt: { gte: todayStart } }
    });

    res.json({
      totalInventory,
      activeIssues,
      overdueItems,
      processedToday
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch library stats.' });
  }
});

// ── GET /api/library/books ──────────────────────────────────────────────────
router.get('/books', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { title: 'asc' }
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books.' });
  }
});

// ── GET /api/library/issues ──────────────────────────────────────────────────
router.get('/issues', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    // Dynamically update overdue status
    await prisma.libraryIssue.updateMany({
      where: { status: 'issued', dueDate: { lt: new Date() } },
      data: { status: 'overdue' }
    });

    const issues = await prisma.libraryIssue.findMany({
      where: {
        student: { isActive: true }
      },
      include: {
        student: { select: { fullName: true, studentId: true, profileImage: true } },
        book: { select: { title: true, bookCode: true } }
      },
      orderBy: { issueDate: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    console.error('Issues Error:', error);
    res.status(500).json({ error: 'Failed to fetch library issues.' });
  }
});

// ── POST /api/library/issue ──────────────────────────────────────────────────
router.post('/issue', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  const { studentId, bookId, issueDate } = req.body;
  if (!studentId || !bookId) {
    return res.status(400).json({ error: 'Student ID and Book Code are required.' });
  }

  try {
    let student = await prisma.student.findUnique({ where: { studentId: studentId } });
    if (!student) {
      student = await prisma.student.findUnique({ where: { rfidTag: studentId } });
    }
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const book = await prisma.book.findUnique({ where: { bookCode: bookId } });
    if (!book) return res.status(404).json({ error: 'Book not found.' });

    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: 'No copies available for this book.' });
    }

    const iDate = issueDate ? new Date(issueDate) : new Date();
    const dDate = new Date(iDate);
    dDate.setDate(dDate.getDate() + 14);

    const [newIssue, updatedBook] = await prisma.$transaction([
      prisma.libraryIssue.create({
        data: {
          studentId: student.id,
          bookId: book.id,
          status: 'issued',
          issueDate: iDate,
          dueDate: dDate
        },
        include: {
          student: { select: { fullName: true, studentId: true, profileImage: true } },
          book: { select: { title: true, bookCode: true } }
        }
      }),
      prisma.book.update({
        where: { id: book.id },
        data: { availableCopies: book.availableCopies - 1 }
      })
    ]);

    res.status(201).json({ message: 'Book issued successfully.', issue: newIssue });
  } catch (error) {
    console.error('Issue Error:', error);
    res.status(500).json({ error: 'Failed to issue book.' });
  }
});

// ── PUT /api/library/issue/:id/return ──────────────────────────────────────────
router.put('/issue/:id/return', verifyToken, checkPermission('canAccessLibrary'), async (req, res) => {
  try {
    const issue = await prisma.libraryIssue.findUnique({ where: { id: req.params.id } });
    if (!issue) return res.status(404).json({ error: 'Issue not found.' });

    if (issue.status === 'returned') return res.status(400).json({ error: 'Already returned.' });

    await prisma.$transaction([
      prisma.libraryIssue.update({
        where: { id: req.params.id },
        data: { status: 'returned' }
      }),
      prisma.book.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } }
      })
    ]);

    res.json({ message: 'Book returned successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to return book.' });
  }
});

const rfidService = require('../services/rfidService');

// ── POST /api/library/rfid-scan ───────────────────────────────────────────────
router.post('/rfid-scan', async (req, res) => {
  const { rfid_uid } = req.body;
  if (!rfid_uid) return res.status(400).json({ success: false, error: 'rfid_uid is required.' });

  try {
    const student = await rfidService.findStudentByRFID(rfid_uid);
    
    // Fetch active issues, due books, and calculate fine
    const activeIssues = await prisma.libraryIssue.findMany({
      where: { studentId: student.id, status: { in: ['issued', 'overdue'] } },
      include: { book: { select: { title: true, bookCode: true } } }
    });

    let totalFine = 0;
    const now = new Date();
    
    const formattedIssues = activeIssues.map(issue => {
      let fine = 0;
      if (now > new Date(issue.dueDate)) {
        const daysLate = Math.ceil((now - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24));
        fine = daysLate * 2; // Rs 2 per day
        totalFine += fine;
      }
      return {
        id: issue.id,
        bookTitle: issue.book.title,
        bookCode: issue.book.bookCode,
        issueDate: issue.issueDate,
        dueDate: issue.dueDate,
        status: issue.status,
        fine
      };
    });

    res.json({
      success: true,
      student: { 
        id: student.id,
        name: student.fullName, 
        className: student.className,
        photo: student.profileImage
      },
      profile: {
        activeLoans: formattedIssues.length,
        dueBooks: formattedIssues.filter(i => new Date() > new Date(i.dueDate)).length,
        libraryFine: totalFine,
        issues: formattedIssues
      }
    });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

module.exports = router;
