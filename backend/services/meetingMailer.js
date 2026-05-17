const { transporter } = require('../mailer');
const { format } = require('date-fns');

/**
 * Send a Google Meet invitation email to a participant
 */
const sendMeetingInvite = async ({ to, participantName, meetingTitle, scheduledAt, durationMins, meetUrl, organizerName, description }) => {
  const isDevMode = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

  const formattedDate = format(new Date(scheduledAt), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(scheduledAt), 'hh:mm a');
  const endTime = new Date(new Date(scheduledAt).getTime() + durationMins * 60 * 1000);
  const formattedEndTime = format(endTime, 'hh:mm a');

  if (isDevMode) {
    console.log('\n====================================================');
    console.log('⚠️  DEV MODE: Meeting Invite logged to console.');
    console.log(`📩 To: ${to}`);
    console.log(`📅 Meeting: ${meetingTitle}`);
    console.log(`🕐 Time: ${formattedDate} ${formattedTime}`);
    console.log(`🔗 Meet URL: ${meetUrl}`);
    console.log('====================================================\n');
    return { success: true };
  }

  try {
    const mailOptions = {
      from: `"EduScan School" <${process.env.EMAIL_USER}>`,
      to,
      subject: `📅 Meeting Invitation: ${meetingTitle}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Meeting Invitation – EduScan</title>
        </head>
        <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.4);">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:36px 40px;text-align:center;border-bottom:2px solid #00d9cc;">
                      <div style="display:inline-block;background:rgba(0,217,204,0.1);border:2px solid #00d9cc;border-radius:50%;padding:14px;margin-bottom:16px;">
                        <span style="font-size:28px;">📹</span>
                      </div>
                      <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 6px 0;">You're Invited to a Meeting</h1>
                      <p style="color:#00d9cc;font-size:14px;margin:0;font-weight:600;">${meetingTitle}</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="background:#1e293b;padding:36px 40px;">
                      <p style="color:#94a3b8;font-size:15px;margin:0 0 24px 0;">
                        Hello <strong style="color:#f8fafc;">${participantName || 'there'}</strong>,
                      </p>
                      <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px 0;">
                        <strong style="color:#f8fafc;">${organizerName}</strong> has scheduled a Google Meet for you.
                        ${description ? `<br><br><em style="color:#64748b;">${description}</em>` : ''}
                      </p>

                      <!-- Meeting Details Card -->
                      <div style="background:#0f172a;border:1px solid rgba(0,217,204,0.2);border-radius:16px;padding:24px;margin-bottom:28px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                              <span style="color:#64748b;font-size:13px;">📅 Date</span><br>
                              <span style="color:#f8fafc;font-size:15px;font-weight:600;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                              <span style="color:#64748b;font-size:13px;">🕐 Time</span><br>
                              <span style="color:#f8fafc;font-size:15px;font-weight:600;">${formattedTime} – ${formattedEndTime} (IST)</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                              <span style="color:#64748b;font-size:13px;">⏱ Duration</span><br>
                              <span style="color:#f8fafc;font-size:15px;font-weight:600;">${durationMins} minutes</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:10px 0;">
                              <span style="color:#64748b;font-size:13px;">👤 Organizer</span><br>
                              <span style="color:#f8fafc;font-size:15px;font-weight:600;">${organizerName}</span>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Join Button -->
                      <div style="text-align:center;margin:32px 0;">
                        <a href="${meetUrl}"
                           style="display:inline-block;background:linear-gradient(135deg,#00d9cc,#0891b2);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(0,217,204,0.35);">
                          🎥 Join Google Meet
                        </a>
                      </div>

                      <!-- Meet Link Fallback -->
                      <div style="background:rgba(0,217,204,0.05);border:1px solid rgba(0,217,204,0.15);border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
                        <p style="color:#64748b;font-size:12px;margin:0 0 6px 0;">Or copy this link:</p>
                        <a href="${meetUrl}" style="color:#00d9cc;font-size:13px;word-break:break-all;">${meetUrl}</a>
                      </div>

                      <p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">
                        If you have any questions, please contact your school administrator or teacher.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#0f172a;padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
                      <p style="color:#475569;font-size:12px;margin:0 0 4px 0;">© ${new Date().getFullYear()} EduScan RFID School Management System</p>
                      <p style="color:#334155;font-size:11px;margin:0;">This is an automated invitation. Please do not reply to this email.</p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Meeting invite sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending meeting invite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send meeting cancellation email
 */
const sendMeetingCancellation = async ({ to, participantName, meetingTitle, scheduledAt }) => {
  const formattedDate = format(new Date(scheduledAt), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(scheduledAt), 'hh:mm a');

  try {
    await transporter.sendMail({
      from: `"EduScan School" <${process.env.EMAIL_USER}>`,
      to,
      subject: `❌ Meeting Cancelled: ${meetingTitle}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#1e293b;border-radius:16px;color:#f8fafc;">
          <h2 style="color:#ef4444;margin:0 0 16px 0;">Meeting Cancelled</h2>
          <p>Hello <strong>${participantName || 'there'}</strong>,</p>
          <p>The following meeting has been cancelled:</p>
          <div style="background:#0f172a;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 8px 0;"><strong style="color:#ef4444;">❌ ${meetingTitle}</strong></p>
            <p style="margin:0;color:#94a3b8;">${formattedDate} at ${formattedTime} IST</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;">Please contact your school for rescheduling details.</p>
          <p style="color:#475569;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} EduScan School Management</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendMeetingInvite, sendMeetingCancellation };
