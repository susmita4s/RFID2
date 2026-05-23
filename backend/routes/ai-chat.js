const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { verifyToken } = require('./auth');
const { generateResponse } = require('../services/aiService');

// POST /api/ai-chat/message
router.post('/message', verifyToken, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const parentId = req.user.id;

    // 1. Fetch Student Data linked to Parent
    const student = await prisma.student.findFirst({
      where: { userId: parentId },
      include: {
        rfidWallet: true,
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        feeTransactions: { orderBy: { createdAt: 'desc' }, take: 5 },
        libraryIssues: { include: { book: true }, where: { status: 'issued' } },
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'No linked student found for this parent.' });
    }

    // 2. Fetch Chat History (for AI context)
    const history = await prisma.aIChatMessage.findMany({
      where: { parentId, studentId: student.id },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    // 3. Save User Message to DB
    const userMsg = await prisma.aIChatMessage.create({
      data: { parentId, studentId: student.id, role: 'user', message }
    });

    // 4. Get AI Response from Gemini
    const parentUser = await prisma.user.findUnique({ where: { id: parentId } });
    let aiResponseText;
    let aiError = false;

    try {
      aiResponseText = await generateResponse(parentUser, student, message, history);
    } catch (err) {
      console.error('Gemini generateResponse error:', err.message);
      aiError = true;
      // Delete the user message we just saved so history stays clean
      await prisma.aIChatMessage.delete({ where: { id: userMsg.id } });
      return res.status(503).json({
        error: 'ai_unavailable',
        message: 'The AI service is temporarily busy. Please wait a moment and try again.'
      });
    }

    // 5. Save AI Response to DB only if it succeeded
    const aiMsg = await prisma.aIChatMessage.create({
      data: { parentId, studentId: student.id, role: 'assistant', message: aiResponseText }
    });

    res.json({ success: true, userMsg, message: aiMsg });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to process AI message' });
  }
});


// GET /api/ai-chat/history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const parentId = req.user.id;
    const student = await prisma.student.findFirst({ where: { userId: parentId } });
    if (!student) return res.json({ success: true, messages: [] });

    const messages = await prisma.aIChatMessage.findMany({
      where: { parentId, studentId: student.id },
      orderBy: { createdAt: 'asc' } // Keep ascending for chat UI
    });

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Fetch AI History Error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// POST /api/ai-chat/escalate
router.post('/escalate', verifyToken, async (req, res) => {
  const { issue } = req.body;
  if (!issue) return res.status(400).json({ error: 'Issue description is required' });

  try {
    const parentId = req.user.id;
    const student = await prisma.student.findFirst({ where: { userId: parentId } });
    
    if (!student) {
      return res.status(404).json({ error: 'No linked student found.' });
    }

    const escalation = await prisma.aIEscalation.create({
      data: {
        parentId,
        studentId: student.id,
        issue
      }
    });

    res.json({ success: true, escalation });
  } catch (error) {
    console.error('Escalation Error:', error);
    res.status(500).json({ error: 'Failed to create escalation' });
  }
});

module.exports = router;
