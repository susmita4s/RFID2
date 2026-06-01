const prisma = require('../prismaClient');

class RFIDService {
  /**
   * Assign an RFID UID to a specific student
   * @param {number} studentId - The ID of the student
   * @param {string} rfidUid - The scanned RFID UID
   * @returns {Object} updated student
   */
  async assignRFID(studentId, rfidUid) {
    if (!studentId || !rfidUid) {
      throw new Error('Student ID and RFID UID are required.');
    }

    // Check if the RFID is already assigned to someone else (search both columns)
    const existing = await prisma.student.findFirst({
      where: {
        OR: [
          { rfidTag: rfidUid },
          { rfid_uid: rfidUid }
        ]
      }
    });

    if (existing && existing.id !== studentId) {
      throw new Error('This RFID card is already assigned to another student.');
    }

    // Write to both RFID columns so all routes can find the student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { rfidTag: rfidUid, rfid_uid: rfidUid },
    });

    return updatedStudent;
  }

  /**
   * Find a student by their RFID UID
   * @param {string} rfidUid - The scanned RFID UID
   * @returns {Object} student details
   */
  async findStudentByRFID(rfidUid) {
    if (!rfidUid) {
      throw new Error('RFID UID is required.');
    }

    // Search both RFID columns — card may be stored in either field
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { rfidTag: rfidUid },
          { rfid_uid: rfidUid }
        ]
      }
    });

    if (!student) {
      throw new Error('Card Not Registered. No student found with this RFID.');
    }

    if (!student.isActive) {
      throw new Error('Student account is inactive.');
    }

    return student;
  }
}

module.exports = new RFIDService();
