const { getDb } = require('../database/database');

// Scan QR code for attendance
const scanQR = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const db = getDb();

    console.log(`Scanning QR: userId=${userId}, eventId=${eventId}`);

    // Check if user is registered for this event
    const registration = await db.get(
      `SELECT * FROM registrations 
       WHERE user_id = ? AND event_id = ? 
       LIMIT 1`,
      [userId, eventId]
    );

    if (!registration) {
      return res.status(400).json({ 
        success: false,
        message: 'Student not registered for this event' 
      });
    }

    // Check if already checked in
    if (registration.attendance_status === 'checked_in') {
      return res.status(400).json({ 
        success: false,
        message: 'Student already checked in' 
      });
    }

    // Update attendance status and auto-approve registration
    const now = new Date().toISOString();
    await db.run(
      `UPDATE registrations 
       SET attendance_status = ?, approval_status = ?, check_in_time = ? 
       WHERE id = ?`,
      ['checked_in', 'approved', now, registration.id]
    );

    // Get updated registration with student and event details
    const updated = await db.get(
      `SELECT r.*, 
              u.name as student_name,
              e.name as event_name
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.id = ?`,
      [registration.id]
    );

    console.log(`Check-in successful: ${updated.student_name} for event ${updated.event_name}`);

    res.json({ 
      success: true,
      message: `${updated.student_name} checked in successfully!`,
      registration: updated
    });
  } catch (error) {
    console.error('Scan QR error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

const getAttendance = async (req, res) => {
  res.json({ message: 'Get attendance endpoint' });
};

module.exports = { scanQR, getAttendance };