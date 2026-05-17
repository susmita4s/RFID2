const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// ── OAuth2 Client ─────────────────────────────────────────────────────────────
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.CLIENT_URL?.replace(':3000', ':5000') || 'http://localhost:5000'}/api/meetings/google/callback`
  );
};

// ── Generate Google Auth URL ───────────────────────────────────────────────────
const getAuthUrl = () => {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });
};

// ── Exchange Code for Tokens ──────────────────────────────────────────────────
const getTokensFromCode = async (code) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// ── Create Google Calendar Event with Meet Link ───────────────────────────────
const createCalendarMeeting = async (tokens, { title, description, scheduledAt, durationMins, attendeeEmails }) => {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);

  const attendees = attendeeEmails.map(email => ({ email }));

  const event = {
    summary: title,
    description: description || '',
    start: { dateTime: startTime.toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' },
    attendees,
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
  });

  const meetUrl = response.data.conferenceData?.entryPoints?.[0]?.uri || generateFallbackMeetUrl();
  const eventId = response.data.id;

  return { meetUrl, eventId };
};

// ── Fallback Meet URL (when no Google auth) ───────────────────────────────────
const generateFallbackMeetUrl = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
};

// ── Refresh Access Token if Expired ──────────────────────────────────────────
const refreshAccessToken = async (storedToken) => {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: storedToken.refreshToken,
  });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  createCalendarMeeting,
  generateFallbackMeetUrl,
  refreshAccessToken,
};
