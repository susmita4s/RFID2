const { GoogleGenAI } = require('@google/genai');
const prisma = require('../prismaClient');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Builds a structured context object from the student database record.
 */
function buildContext(student) {
  if (!student) return "No student context available.";

  let context = `Student Name: ${student.fullName}\n`;
  context += `Class: ${student.className}, Section: ${student.section || 'N/A'}, Roll No: ${student.rollNumber}\n`;
  context += `RFID Tag: ${student.rfidTag || 'Not Assigned'}\n`;
  context += `Wallet Balance: ₹${student.rfidWallet?.balance || 0}\n`;

  if (student.attendances && student.attendances.length > 0) {
    const total = student.attendances.length;
    const present = student.attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    context += `Attendance: ${((present / total) * 100).toFixed(1)}% (${present}/${total} days present)\n`;
    
    // Add today's or most recent attendance
    const lastAtt = student.attendances[0];
    const dateStr = new Date(lastAtt.date).toDateString();
    context += `Most recent attendance (${dateStr}): Status: ${lastAtt.status}. `;
    if (lastAtt.checkIn) context += `Check-in: ${new Date(lastAtt.checkIn).toLocaleTimeString()}. `;
    if (lastAtt.checkOut) context += `Check-out: ${new Date(lastAtt.checkOut).toLocaleTimeString()}.`;
    context += '\n';
  }

  if (student.feeTransactions && student.feeTransactions.length > 0) {
    context += `Recent Fee Transactions:\n`;
    student.feeTransactions.forEach(tx => {
      context += `- ${tx.description}: ₹${tx.amount} (${tx.status}) [${new Date(tx.createdAt).toDateString()}]\n`;
    });
  }

  if (student.libraryIssues && student.libraryIssues.length > 0) {
    context += `Library Books:\n`;
    student.libraryIssues.forEach(issue => {
      context += `- Book: ${issue.book.title} | Status: ${issue.status} | Due: ${new Date(issue.dueDate).toDateString()}\n`;
    });
  }

  return context;
}

/**
 * Handles generating the AI response.
 */
async function generateResponse(parentUser, student, message, chatHistory = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Please configure GEMINI_API_KEY in .env");
  }

  const contextData = buildContext(student);
  const parentName = parentUser.firstName ? `${parentUser.firstName} ${parentUser.lastName || ''}` : 'Parent';

  const systemPrompt = `You are an AI Parent Assistant for a School RFID Management System.

Your responsibilities:
- Help parents with attendance queries
- Help with fees and payments
- Help with library details
- Help with homework and exams
- Help with school notices
- Reply politely and professionally
- Never generate fake information
- Only answer using provided database data
- If information is unavailable, ask parent to contact administrator
- Keep responses short and clear
- Support English, Bengali, and Hindi. Automatically reply in the language used by the parent.

Current Parent: ${parentName}
Current Date & Time: ${new Date().toLocaleString('en-IN')}

AVAILABLE STUDENT DATA (USE ONLY THIS FOR FACTUAL ANSWERS):
${contextData}
`;

  // Format history for Gemini
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.message }]
  }));

  const contents = [
    ...formattedHistory,
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to communicate with AI service.");
  }
}

module.exports = {
  generateResponse,
};
