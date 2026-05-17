const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('./auth');
const prisma = require('../prismaClient');
const {
  getAuthUrl,
  getTokensFromCode,
  createCalendarMeeting,
  generateFallbackMeetUrl,
  refreshAccessToken,
} = require('../services/googleCalendar');
const { sendMeetingInvite, sendMeetingCancellation } = require('../services/meetingMailer');

const router = express.Router();

// ── Helper: Create a notification via Socket.IO ──────────────────────────────
async function notifyUser(io, { userId, role, title, message }) {
  try {
    await prisma.$executeRaw`
      INSERT INTO Notification (userId, role, title, message, isRead, createdAt)
      VALUES (${userId}, ${role}, ${title}, ${message}, false, NOW())
    `;
    if (io) io.to(`user_${userId}`).emit('newNotification', { userId, role, title, message });
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// ── Helper: Get valid Google tokens for a user ────────────────────────────────
async function getValidTokens(userId) {
  const stored = await prisma.$queryRaw`
    SELECT * FROM GoogleToken WHERE userId = ${userId} LIMIT 1
  `;
  if (!stored || stored.length === 0) return null;

  const tokenRow = stored[0];
  const now = new Date();
  const expiry = tokenRow.expiresAt ? new Date(tokenRow.expiresAt) : null;

  // Refresh if expired
  if (expiry && now >= expiry && tokenRow.refreshToken) {
    try {
      const newCreds = await refreshAccessToken(tokenRow);
      const newExpiry = newCreds.expiry_date ? new Date(newCreds.expiry_date) : null;
      await prisma.$executeRaw`
        UPDATE GoogleToken
        SET accessToken = ${newCreds.access_token}, expiresAt = ${newExpiry}, updatedAt = NOW()
        WHERE userId = ${userId}
      `;
      return { access_token: newCreds.access_token, refresh_token: tokenRow.refreshToken };
    } catch (e) {
      console.error('Token refresh failed:', e);
      return null;
    }
  }

  return { access_token: tokenRow.accessToken, refresh_token: tokenRow.refreshToken };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings/google/auth  → Redirect to Google OAuth
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/google/auth', verifyToken, (req, res) => {
  const { role } = req.user;
  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'Only Admin or Teacher can connect Google Calendar.' });
  }
  // Store userId in state for callback (base64 encoded)
  const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');
  const authUrl = getAuthUrl() + `&state=${encodeURIComponent(state)}`;
  res.redirect(authUrl);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings/google/callback  → Handle OAuth callback
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.redirect(`${process.env.CLIENT_URL}/dashboard?googleAuth=error`);

  try {
    let userId = null;
    if (state) {
      const decoded = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
      userId = decoded.userId;
    }

    const tokens = await getTokensFromCode(code);
    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    if (userId) {
      // Upsert Google token
      const existing = await prisma.$queryRaw`SELECT id FROM GoogleToken WHERE userId = ${userId} LIMIT 1`;
      if (existing && existing.length > 0) {
        await prisma.$executeRaw`
          UPDATE GoogleToken
          SET accessToken = ${tokens.access_token}, refreshToken = ${tokens.refresh_token || null},
              expiresAt = ${expiry}, updatedAt = NOW()
          WHERE userId = ${userId}
        `;
      } else {
        await prisma.$executeRaw`
          INSERT INTO GoogleToken (userId, accessToken, refreshToken, expiresAt, createdAt, updatedAt)
          VALUES (${userId}, ${tokens.access_token}, ${tokens.refresh_token || null}, ${expiry}, NOW(), NOW())
        `;
      }
    }

    res.redirect(`${process.env.CLIENT_URL}/dashboard?googleAuth=success&tab=meetings`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?googleAuth=error`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings/google/status  → Check if user has Google connected
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/google/status', verifyToken, async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT id, expiresAt FROM GoogleToken WHERE userId = ${req.user.id} LIMIT 1
    `;
    res.json({ connected: rows && rows.length > 0 });
  } catch (error) {
    res.json({ connected: false });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/meetings/create  → Create meeting (Admin/Teacher only)
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/create', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;
  const io = req.app.get('io');

  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'Only Admin or Teacher can create meetings.' });
  }

  const { title, description, scheduledAt, durationMins = 60, participants } = req.body;
  // participants: [{ email, name, userId (optional), role }]

  if (!title || !scheduledAt) {
    return res.status(400).json({ error: 'title and scheduledAt are required.' });
  }

  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'At least one participant is required.' });
  }

  try {
    const meetingUuid = uuidv4();
    let googleMeetUrl = generateFallbackMeetUrl();
    let googleEventId = null;

    // Try to use Google Calendar API if tokens available
    const tokens = await getValidTokens(userId);
    if (tokens) {
      try {
        const attendeeEmails = participants.map(p => p.email).filter(Boolean);
        const calResult = await createCalendarMeeting(tokens, {
          title,
          description,
          scheduledAt,
          durationMins: Number(durationMins),
          attendeeEmails,
        });
        googleMeetUrl = calResult.meetUrl;
        googleEventId = calResult.eventId;
        console.log(`✅ Google Calendar event created: ${googleEventId}`);
      } catch (calError) {
        console.error('Google Calendar API error (falling back to random Meet URL):', calError.message);
        // Fallback URL already set above
      }
    }

    // Get creator name
    const creatorRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true }
    });
    const organizerName = creatorRow
      ? `${creatorRow.firstName || ''} ${creatorRow.lastName || ''}`.trim() || creatorRow.email
      : 'School';

    // Insert Meeting
    await prisma.$executeRaw`
      INSERT INTO Meeting (meetingUuid, title, description, googleMeetUrl, googleEventId, createdById, creatorRole, scheduledAt, durationMins, status, createdAt, updatedAt)
      VALUES (${meetingUuid}, ${title}, ${description || null}, ${googleMeetUrl}, ${googleEventId || null}, ${userId}, ${role}, ${new Date(scheduledAt)}, ${Number(durationMins)}, 'scheduled', NOW(), NOW())
    `;

    // Fetch meeting id
    const meetingRows = await prisma.$queryRaw`
      SELECT id FROM Meeting WHERE meetingUuid = ${meetingUuid} LIMIT 1
    `;
    const meetingId = meetingRows[0].id;

    // Insert participants and send emails/notifications
    for (const p of participants) {
      const pEmail = p.email?.trim();
      if (!pEmail) continue;

      await prisma.$executeRaw`
        INSERT INTO MeetingParticipant (meetingId, userId, email, name, role, inviteStatus, createdAt)
        VALUES (${meetingId}, ${p.userId || null}, ${pEmail}, ${p.name || null}, ${p.role || 'parent'}, 'pending', NOW())
      `;

      // Send email invitation
      sendMeetingInvite({
        to: pEmail,
        participantName: p.name || pEmail,
        meetingTitle: title,
        scheduledAt,
        durationMins: Number(durationMins),
        meetUrl: googleMeetUrl,
        organizerName,
        description,
      }).catch(err => console.error('Email send error:', err));

      // Push notification if user has an account
      if (p.userId) {
        notifyUser(io, {
          userId: p.userId,
          role: p.role || 'parent',
          title: `📅 New Meeting: ${title}`,
          message: `${organizerName} scheduled a meeting on ${new Date(scheduledAt).toLocaleDateString('en-IN')}. Click to join.`,
        });
      }
    }

    // Fetch full meeting for response
    const fullMeeting = await prisma.$queryRaw`
      SELECT * FROM Meeting WHERE id = ${meetingId} LIMIT 1
    `;

    res.status(201).json({
      success: true,
      meeting: fullMeeting[0],
      googleCalendarLinked: !!tokens,
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting.', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings  → List meetings (role-filtered)
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    let meetings = [];

    if (role === 'admin') {
      // Admin sees all meetings
      meetings = await prisma.$queryRaw`
        SELECT m.*, CAST(COUNT(mp.id) AS UNSIGNED) as participantCount
        FROM Meeting m
        LEFT JOIN MeetingParticipant mp ON mp.meetingId = m.id
        GROUP BY m.id
        ORDER BY m.scheduledAt DESC
        LIMIT 50
      `;
    } else if (role === 'teacher') {
      // Teacher sees meetings they created
      meetings = await prisma.$queryRaw`
        SELECT m.*, CAST(COUNT(mp.id) AS UNSIGNED) as participantCount
        FROM Meeting m
        LEFT JOIN MeetingParticipant mp ON mp.meetingId = m.id
        WHERE m.createdById = ${userId}
        GROUP BY m.id
        ORDER BY m.scheduledAt DESC
        LIMIT 50
      `;
    } else if (role === 'parent') {
      // Parent sees only meetings they are invited to
      meetings = await prisma.$queryRaw`
        SELECT m.*, mp.inviteStatus, CAST(COUNT(mp2.id) AS UNSIGNED) as participantCount
        FROM Meeting m
        INNER JOIN MeetingParticipant mp ON mp.meetingId = m.id AND mp.userId = ${userId}
        LEFT JOIN MeetingParticipant mp2 ON mp2.meetingId = m.id
        WHERE m.status != 'cancelled'
        GROUP BY m.id, mp.inviteStatus
        ORDER BY m.scheduledAt DESC
        LIMIT 20
      `;
    }

    // Convert any other BigInt fields to String/Number if necessary, but CAST AS UNSIGNED should fix participantCount
    const serializedMeetings = meetings.map(m => ({
      ...m,
      participantCount: Number(m.participantCount) || 0
    }));

    res.json({ success: true, meetings: serializedMeetings });
  } catch (error) {
    console.error('List meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings/:id  → Get single meeting details
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/:id', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;
  const meetingId = Number(req.params.id);

  try {
    const meetings = await prisma.$queryRaw`
      SELECT * FROM Meeting WHERE id = ${meetingId} LIMIT 1
    `;
    if (!meetings || meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    const meeting = meetings[0];

    // Access control
    if (role === 'parent') {
      const access = await prisma.$queryRaw`
        SELECT id FROM MeetingParticipant WHERE meetingId = ${meetingId} AND userId = ${userId} LIMIT 1
      `;
      if (!access || access.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (role === 'teacher' && meeting.createdById !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const participants = await prisma.$queryRaw`
      SELECT * FROM MeetingParticipant WHERE meetingId = ${meetingId}
    `;

    res.json({ success: true, meeting, participants });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/meetings/:id  → Cancel meeting (Admin or creator Teacher)
// ═══════════════════════════════════════════════════════════════════════════════
router.delete('/:id', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;
  const meetingId = Number(req.params.id);
  const io = req.app.get('io');

  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'Only Admin or Teacher can cancel meetings.' });
  }

  try {
    const meetings = await prisma.$queryRaw`
      SELECT * FROM Meeting WHERE id = ${meetingId} LIMIT 1
    `;
    if (!meetings || meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found.' });
    }

    const meeting = meetings[0];

    if (role === 'teacher' && meeting.createdById !== userId) {
      return res.status(403).json({ error: 'You can only cancel meetings you created.' });
    }

    // Update status
    await prisma.$executeRaw`
      UPDATE Meeting SET status = 'cancelled', updatedAt = NOW() WHERE id = ${meetingId}
    `;

    // Get participants with userId for notifications
    const participants = await prisma.$queryRaw`
      SELECT * FROM MeetingParticipant WHERE meetingId = ${meetingId}
    `;

    // Send cancellation emails and notifications
    for (const p of participants) {
      sendMeetingCancellation({
        to: p.email,
        participantName: p.name || p.email,
        meetingTitle: meeting.title,
        scheduledAt: meeting.scheduledAt,
      }).catch(() => {});

      if (p.userId) {
        notifyUser(io, {
          userId: p.userId,
          role: p.role,
          title: `❌ Meeting Cancelled: ${meeting.title}`,
          message: `The meeting scheduled for ${new Date(meeting.scheduledAt).toLocaleDateString('en-IN')} has been cancelled.`,
        });
      }
    }

    res.json({ success: true, message: 'Meeting cancelled.' });
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ error: 'Failed to cancel meeting.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/meetings/:id/notify  → Re-send invites
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/:id/notify', verifyToken, async (req, res) => {
  const { id: userId, role } = req.user;
  const meetingId = Number(req.params.id);

  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const meetings = await prisma.$queryRaw`SELECT * FROM Meeting WHERE id = ${meetingId} LIMIT 1`;
    if (!meetings || meetings.length === 0) return res.status(404).json({ error: 'Meeting not found.' });

    const meeting = meetings[0];
    if (role === 'teacher' && meeting.createdById !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const creatorRow = await prisma.user.findUnique({ where: { id: meeting.createdById }, select: { firstName: true, lastName: true, email: true } });
    const organizerName = creatorRow ? `${creatorRow.firstName || ''} ${creatorRow.lastName || ''}`.trim() || creatorRow.email : 'School';

    const participants = await prisma.$queryRaw`SELECT * FROM MeetingParticipant WHERE meetingId = ${meetingId}`;
    let sent = 0;
    for (const p of participants) {
      const result = await sendMeetingInvite({
        to: p.email,
        participantName: p.name || p.email,
        meetingTitle: meeting.title,
        scheduledAt: meeting.scheduledAt,
        durationMins: meeting.durationMins,
        meetUrl: meeting.googleMeetUrl,
        organizerName,
        description: meeting.description,
      });
      if (result.success) sent++;
    }

    res.json({ success: true, message: `Invites resent to ${sent} participant(s).` });
  } catch (error) {
    console.error('Re-notify error:', error);
    res.status(500).json({ error: 'Failed to resend invites.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/meetings/parents/list  → Get all parents for meeting invite selection
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/parents/list', verifyToken, async (req, res) => {
  const { role } = req.user;
  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const parents = await prisma.user.findMany({
      where: { role: 'parent' },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' }
    });

    const result = parents.map(p => ({
      id: p.id,
      name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email,
      email: p.email,
      role: 'parent',
    }));

    res.json({ success: true, parents: result });
  } catch (error) {
    console.error('List parents error:', error);
    res.status(500).json({ error: 'Failed to fetch parents.' });
  }
});

module.exports = router;
