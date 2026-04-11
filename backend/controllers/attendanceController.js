const { getDb } = require('../database/database');

// Scan QR code for attendance
const scanQR = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const db = getDb();

    console.log(`Scanning QR: userId=${userId}, eventId=${eventId}`);

    // Check if user is registered for this event
    const registrationResult = await db.query(
      `SELECT * FROM registrations 
       WHERE user_id = $1 AND event_id = $2 
       LIMIT 1`,
      [userId, eventId]
    );
    const registration = registrationResult.rows[0];

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
    await db.query(
      `UPDATE registrations 
       SET attendance_status = $1, approval_status = $2, check_in_time = $3 
       WHERE id = $4`,
      ['checked_in', 'approved', now, registration.id]
    );

    // Get updated registration with student and event details
    const updatedResult = await db.query(
      `SELECT r.*, 
              u.name as student_name,
              e.name as event_name
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN events e ON r.event_id = e.id
       WHERE r.id = $1`,
      [registration.id]
    );
    const updated = updatedResult.rows[0];

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