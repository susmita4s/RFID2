const express = require('express');
const { verifyToken } = require('./auth');

const router = express.Router();
const prisma = require('../prismaClient');

// ── Helper: Create a notification and emit it via Socket.IO ─────────────────
async function createNotification(io, { userId, role, title, message, relatedChatId }) {
  try {
    await prisma.$executeRaw`
      INSERT INTO Notification (userId, role, title, message, isRead, relatedChatId, createdAt)
      VALUES (${userId}, ${role}, ${title}, ${message}, false, ${relatedChatId || null}, NOW())
    `;
    // Emit to the specific user's socket room
    if (io) {
      io.to(`user_${userId}`).emit('newNotification', { userId, role, title, message, relatedChatId });
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

// ── GET /api/chat/contacts ──────────────────────────────────────────────────
router.get('/contacts', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    if (role === 'parent') {
      // 1. Get the Admin contact info
      const adminUsers = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { id: true, firstName: true, lastName: true, email: true }
      });
      const adminContact = {
        id: adminUsers[0]?.id || 1,
        name: adminUsers[0] ? `${adminUsers[0].firstName} ${adminUsers[0].lastName}` : 'School Admin Support',
        email: adminUsers[0]?.email || 'admin@school.com',
        role: 'admin',
        chatType: 'admin_chat',
        lastMessage: 'Chat with Admin Support',
        unseenCount: 0
      };

      // 2. Get the Teacher contact info (assigned class teacher)
      const teacherUsers = await prisma.user.findMany({
        where: { role: { in: ['teacher', 'user'] }, email: { contains: 'teacher' } },
        select: { id: true, firstName: true, lastName: true, email: true, role: true }
      });
      const teacherContact = {
        id: teacherUsers[0]?.id || 2,
        name: teacherUsers[0] ? `${teacherUsers[0].firstName || 'Class'} ${teacherUsers[0].lastName || 'Teacher'}` : 'Class Teacher',
        email: teacherUsers[0]?.email || 'teacher@school.com',
        role: 'teacher',
        chatType: 'teacher_chat',
        lastMessage: 'Chat with Class Teacher',
        unseenCount: 0
      };

      // Fetch last message and unseen count for Admin Chat
      const lastAdminMsg = await prisma.$queryRaw`
        SELECT message, isSeen, senderId, createdAt FROM ChatMessage
        WHERE chatType = 'admin_chat' AND ((senderId = ${userId}) OR (receiverId = ${userId}))
        ORDER BY createdAt DESC LIMIT 1
      `;
      if (lastAdminMsg && lastAdminMsg.length > 0) {
        adminContact.lastMessage = lastAdminMsg[0].message;
        adminContact.lastMessageTime = lastAdminMsg[0].createdAt;
        const unseen = await prisma.$queryRaw`
          SELECT COUNT(*) as cnt FROM ChatMessage
          WHERE chatType = 'admin_chat' AND receiverId = ${userId} AND isSeen = 0
        `;
        adminContact.unseenCount = Number(unseen[0]?.cnt || 0);
      }

      // Fetch last message and unseen count for Teacher Chat
      const lastTeacherMsg = await prisma.$queryRaw`
        SELECT message, isSeen, senderId, createdAt FROM ChatMessage
        WHERE chatType = 'teacher_chat' AND ((senderId = ${userId}) OR (receiverId = ${userId}))
        ORDER BY createdAt DESC LIMIT 1
      `;
      if (lastTeacherMsg && lastTeacherMsg.length > 0) {
        teacherContact.lastMessage = lastTeacherMsg[0].message;
        teacherContact.lastMessageTime = lastTeacherMsg[0].createdAt;
        const unseen = await prisma.$queryRaw`
          SELECT COUNT(*) as cnt FROM ChatMessage
          WHERE chatType = 'teacher_chat' AND receiverId = ${userId} AND isSeen = 0
        `;
        teacherContact.unseenCount = Number(unseen[0]?.cnt || 0);
      }

      return res.json([adminContact, teacherContact]);

    } else if (role === 'teacher' || (role === 'user' && req.user.email.includes('teacher'))) {
      // Teachers only see parents who have messaged them
      const parentsRaw = await prisma.$queryRaw`
        SELECT DISTINCT senderId FROM ChatMessage
        WHERE chatType = 'teacher_chat' AND receiverId = ${userId}
      `;
      const parentIds = parentsRaw.map(p => Number(p.senderId));

      // Also get anyone the teacher has replied to
      const messagedRaw = await prisma.$queryRaw`
        SELECT DISTINCT receiverId FROM ChatMessage
        WHERE chatType = 'teacher_chat' AND senderId = ${userId}
      `;
      messagedRaw.forEach(p => {
        if (p.receiverId && !parentIds.includes(Number(p.receiverId))) {
          parentIds.push(Number(p.receiverId));
        }
      });

      const parentsInfo = await prisma.user.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      const contacts = [];
      for (const parent of parentsInfo) {
        const lastMsg = await prisma.$queryRaw`
          SELECT message, createdAt FROM ChatMessage
          WHERE chatType = 'teacher_chat' AND (
            (senderId = ${userId} AND receiverId = ${parent.id}) OR
            (senderId = ${parent.id} AND receiverId = ${userId})
          )
          ORDER BY createdAt DESC LIMIT 1
        `;
        const unseen = await prisma.$queryRaw`
          SELECT COUNT(*) as cnt FROM ChatMessage
          WHERE chatType = 'teacher_chat' AND senderId = ${parent.id} AND receiverId = ${userId} AND isSeen = 0
        `;

        contacts.push({
          id: parent.id,
          name: `${parent.firstName} ${parent.lastName}`,
          email: parent.email,
          role: 'parent',
          chatType: 'teacher_chat',
          lastMessage: lastMsg[0]?.message || 'No messages yet',
          lastMessageTime: lastMsg[0]?.createdAt,
          unseenCount: Number(unseen[0]?.cnt || 0)
        });
      }

      return res.json(contacts);

    } else if (role === 'admin') {
      // Admin sees ALL parent conversations (admin_chat only — teachers manage their own)
      const adminChatsRaw = await prisma.$queryRaw`
        SELECT DISTINCT senderId FROM ChatMessage
        WHERE chatType = 'admin_chat'
      `;
      const adminParentIds = adminChatsRaw.map(c => Number(c.senderId));

      const adminParentsInfo = await prisma.user.findMany({
        where: { id: { in: adminParentIds } },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      const adminContacts = [];
      for (const parent of adminParentsInfo) {
        const lastMsg = await prisma.$queryRaw`
          SELECT message, createdAt FROM ChatMessage
          WHERE chatType = 'admin_chat' AND (
            (senderId = ${userId} AND receiverId = ${parent.id}) OR
            (senderId = ${parent.id} AND receiverId = ${userId})
          )
          ORDER BY createdAt DESC LIMIT 1
        `;
        const unseen = await prisma.$queryRaw`
          SELECT COUNT(*) as cnt FROM ChatMessage
          WHERE chatType = 'admin_chat' AND senderId = ${parent.id} AND receiverId = ${userId} AND isSeen = 0
        `;

        adminContacts.push({
          id: parent.id,
          name: `${parent.firstName} ${parent.lastName}`,
          email: parent.email,
          role: 'parent',
          chatType: 'admin_chat',
          lastMessage: lastMsg[0]?.message || 'No messages yet',
          lastMessageTime: lastMsg[0]?.createdAt,
          unseenCount: Number(unseen[0]?.cnt || 0)
        });
      }

      return res.json(adminContacts);
    }

    res.json([]);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// ── GET /api/chat/messages ───────────────────────────────────────────────────
router.get('/messages', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;
  const { chatType, otherUserId, teacherId } = req.query;

  if (!chatType) {
    return res.status(400).json({ error: 'chatType is required.' });
  }

  // Teacher is prohibited from viewing Admin Chats
  if (chatType === 'admin_chat' && (role === 'teacher' || (role === 'user' && req.user.email.includes('teacher')))) {
    return res.status(403).json({ error: 'Access denied. Teachers cannot access Admin Chats.' });
  }

  try {
    let messages = [];

    if (role === 'parent') {
      if (chatType === 'admin_chat') {
        messages = await prisma.$queryRaw`
          SELECT * FROM ChatMessage
          WHERE chatType = 'admin_chat' AND (
            (senderId = ${userId} AND senderRole = 'parent') OR
            (receiverId = ${userId})
          )
          ORDER BY createdAt ASC
        `;
      } else {
        const targetTeacherId = otherUserId ? Number(otherUserId) : 2;
        messages = await prisma.$queryRaw`
          SELECT * FROM ChatMessage
          WHERE chatType = 'teacher_chat' AND (
            (senderId = ${userId} AND receiverId = ${targetTeacherId}) OR
            (senderId = ${targetTeacherId} AND receiverId = ${userId})
          )
          ORDER BY createdAt ASC
        `;
      }

    } else if (role === 'teacher' || (role === 'user' && req.user.email.includes('teacher'))) {
      if (chatType === 'teacher_chat' && otherUserId) {
        messages = await prisma.$queryRaw`
          SELECT * FROM ChatMessage
          WHERE chatType = 'teacher_chat' AND (
            (senderId = ${userId} AND receiverId = ${Number(otherUserId)}) OR
            (senderId = ${Number(otherUserId)} AND receiverId = ${userId})
          )
          ORDER BY createdAt ASC
        `;
      }

    } else if (role === 'admin') {
      if (chatType === 'admin_chat' && otherUserId) {
        messages = await prisma.$queryRaw`
          SELECT * FROM ChatMessage
          WHERE chatType = 'admin_chat' AND (
            (senderId = ${Number(otherUserId)} AND receiverId = ${userId}) OR
            (senderId = ${userId} AND receiverId = ${Number(otherUserId)})
          )
          ORDER BY createdAt ASC
        `;
      } else if (chatType === 'teacher_chat' && otherUserId) {
        const targetTeacherId = teacherId ? Number(teacherId) : 2;
        messages = await prisma.$queryRaw`
          SELECT * FROM ChatMessage
          WHERE chatType = 'teacher_chat' AND (
            (senderId = ${Number(otherUserId)} AND receiverId = ${targetTeacherId}) OR
            (senderId = ${targetTeacherId} AND receiverId = ${Number(otherUserId)})
          )
          ORDER BY createdAt ASC
        `;
      }
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ── POST /api/chat/send ──────────────────────────────────────────────────────
router.post('/send', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;
  const { receiverId, chatType, message } = req.body;
  const io = req.app.get('io');

  if (!chatType || !message) {
    return res.status(400).json({ error: 'chatType and message are required.' });
  }

  // Role validation
  if (chatType === 'admin_chat' && (role === 'teacher' || (role === 'user' && req.user.email.includes('teacher')))) {
    return res.status(403).json({ error: 'Access denied. Teachers cannot send Admin Chats.' });
  }

  try {
    let finalReceiverId = receiverId ? Number(receiverId) : null;
    let notifUserId = null;
    let notifRole = null;
    let notifTitle = '';
    let notifMessage = '';

    if (role === 'parent') {
      if (chatType === 'admin_chat') {
        if (!finalReceiverId) {
          const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
          finalReceiverId = admins[0]?.id || 1;
        }
        notifUserId = finalReceiverId;
        notifRole = 'admin';
        notifTitle = 'New message from Parent';
        notifMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;
      } else {
        if (!finalReceiverId) {
          const teachers = await prisma.user.findMany({
            where: { role: { in: ['teacher', 'user'] }, email: { contains: 'teacher' } },
            select: { id: true }
          });
          finalReceiverId = teachers[0]?.id || 2;
        }
        notifUserId = finalReceiverId;
        notifRole = 'teacher';
        notifTitle = 'New message from Parent';
        notifMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;
      }
    } else if (role === 'teacher' || (role === 'user' && req.user.email.includes('teacher'))) {
      if (!finalReceiverId) {
        return res.status(400).json({ error: 'receiverId is required for teacher replies.' });
      }
      notifUserId = finalReceiverId;
      notifRole = 'parent';
      notifTitle = 'Reply from your Class Teacher';
      notifMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;
    } else if (role === 'admin') {
      if (!finalReceiverId) {
        return res.status(400).json({ error: 'receiverId is required for admin replies.' });
      }
      notifUserId = finalReceiverId;
      notifRole = 'parent';
      notifTitle = 'Reply from School Admin';
      notifMessage = message.length > 60 ? message.substring(0, 60) + '...' : message;
    }

    // Insert ChatMessage
    await prisma.$executeRaw`
      INSERT INTO ChatMessage (senderId, senderRole, receiverId, chatType, message, isSeen, createdAt)
      VALUES (${userId}, ${role}, ${finalReceiverId}, ${chatType}, ${message}, false, NOW())
    `;

    // Fetch inserted row
    const lastRow = await prisma.$queryRaw`
      SELECT * FROM ChatMessage
      WHERE senderId = ${userId} AND message = ${message}
      ORDER BY createdAt DESC LIMIT 1
    `;

    const savedMsg = lastRow[0];

    // Emit real-time Socket.IO event to both sender and receiver rooms
    if (io) {
      const payload = { ...savedMsg };
      io.to(`user_${userId}`).emit('newChatMessage', payload);
      if (finalReceiverId) {
        io.to(`user_${finalReceiverId}`).emit('newChatMessage', payload);
      }
    }

    // Create notification for the receiver
    if (notifUserId) {
      await createNotification(io, {
        userId: notifUserId,
        role: notifRole,
        title: notifTitle,
        message: notifMessage,
        relatedChatId: savedMsg?.id || null
      });
    }

    res.status(201).json(savedMsg);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ── POST /api/chat/mark-seen ──────────────────────────────────────────────────
router.post('/mark-seen', verifyToken, async (req, res) => {
  const { id: userId } = req.user;
  const { chatType, senderId } = req.body;

  if (!chatType || !senderId) {
    return res.status(400).json({ error: 'chatType and senderId are required.' });
  }

  try {
    await prisma.$executeRaw`
      UPDATE ChatMessage
      SET isSeen = true
      WHERE chatType = ${chatType} AND senderId = ${Number(senderId)} AND receiverId = ${userId} AND isSeen = false
    `;
    res.json({ success: true, message: 'Messages marked as seen.' });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ error: 'Failed to mark messages as seen.' });
  }
});

// ── GET /api/chat/notifications ───────────────────────────────────────────────
router.get('/notifications', verifyToken, async (req, res) => {
  const { id: userId } = req.user;
  try {
    const notifications = await prisma.$queryRaw`
      SELECT * FROM Notification
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
      LIMIT 20
    `;
    const unreadCount = await prisma.$queryRaw`
      SELECT COUNT(*) as cnt FROM Notification
      WHERE userId = ${userId} AND isRead = false
    `;
    res.json({
      notifications,
      unreadCount: Number(unreadCount[0]?.cnt || 0)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// ── POST /api/chat/notifications/mark-read ────────────────────────────────────
router.post('/notifications/mark-read', verifyToken, async (req, res) => {
  const { id: userId } = req.user;
  const { notificationId } = req.body; // if null, mark all read

  try {
    if (notificationId) {
      await prisma.$executeRaw`
        UPDATE Notification SET isRead = true
        WHERE id = ${Number(notificationId)} AND userId = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE Notification SET isRead = true
        WHERE userId = ${userId} AND isRead = false
      `;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

module.exports = router;
