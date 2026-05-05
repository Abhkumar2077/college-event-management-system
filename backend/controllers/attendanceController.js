const { getDb } = require('../database/database');

// Scan QR code for attendance
const scanQR = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const db = getDb();

    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'userId and eventId are required'
      });
    }

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

    // Update attendance status and auto-approve registration atomically.
    const now = new Date().toISOString();
    const updateResult = await db.query(
      `UPDATE registrations 
       SET attendance_status = $1, approval_status = $2, check_in_time = $3 
       WHERE id = $4 AND attendance_status <> $5`,
      ['checked_in', 'approved', now, registration.id, 'checked_in']
    );

    const didUpdate = Number(updateResult.rowCount || 0) > 0;
    if (!didUpdate) {
      return res.status(409).json({
        success: false,
        message: 'Student already checked in'
      });
    }

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
  try {
    const { eventId } = req.params;
    const db = getDb();

    const eventResult = await db.query('SELECT id, name, date, time, venue FROM events WHERE id = $1', [eventId]);
    const event = eventResult.rows[0];

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const attendanceResult = await db.query(
      `SELECT r.id,
              r.user_id,
              r.event_id,
              r.attendance_status,
              r.approval_status,
              r.check_in_time,
              r.registration_date,
              u.name as student_name,
              u.email as student_email,
              u.roll_number,
              u.department,
              u.year
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1
       ORDER BY r.registration_date DESC`,
      [eventId]
    );

    const registrations = attendanceResult.rows;
    const checkedIn = registrations.filter((row) => row.attendance_status === 'checked_in').length;

    res.json({
      event,
      summary: {
        totalRegistered: registrations.length,
        checkedIn,
        pending: registrations.length - checkedIn,
        attendanceRate: registrations.length
          ? Number(((checkedIn / registrations.length) * 100).toFixed(2))
          : 0
      },
      registrations
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { scanQR, getAttendance };