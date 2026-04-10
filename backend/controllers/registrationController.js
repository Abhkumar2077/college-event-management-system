const { getDb } = require('../database/database');
const QRCode = require('qrcode');

const getRegistrationCloseAt = (event) => {
  if (!event.register_till) return null;
  return new Date(`${event.register_till}T${event.register_till_time || '23:59'}:00`);
};

// Register for an event
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const db = getDb();

    console.log(`Registering user ${userId} for event ${eventId}`);

    // Check if event exists
    const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrationCloseAt = getRegistrationCloseAt(event);
    if (registrationCloseAt && new Date() >= registrationCloseAt) {
      return res.status(400).json({ message: 'Registration closed for this event' });
    }

    // Check if already registered
    const existing = await db.get(
      'SELECT * FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check capacity
    const registeredCount = await db.get(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
      [eventId]
    );
    if (registeredCount.count >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Get user details
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    
    // Generate QR code data
    const qrData = {
      userId: userId,
      eventId: parseInt(eventId),
      eventName: event.name,
      name: user.name,
      rollNumber: user.roll_number || 'N/A',
      email: user.email,
      timestamp: new Date().toISOString()
    };

    console.log('Generating QR code for data:', qrData);

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#2563eb',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    console.log('QR code generated successfully');

    // Create registration with QR code
    const result = await db.run(
      `INSERT INTO registrations (user_id, event_id, qr_code, attendance_status) 
       VALUES (?, ?, ?, ?)`,
      [userId, eventId, qrCodeDataURL, 'pending']
    );

    const registration = await db.get(
      'SELECT * FROM registrations WHERE id = ?',
      [result.lastID]
    );

    console.log('Registration created:', registration.id);

    res.status(201).json({
      success: true,
      registration,
      qrCode: qrCodeDataURL
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if user is registered for an event
const checkRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const db = getDb();

    const registration = await db.get(
      'SELECT * FROM registrations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    res.json({
      isRegistered: !!registration,
      registration: registration || null
    });
  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's all registrations
const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDb();

    console.log(`Fetching registrations for user ${userId}`);

    const registrations = await db.all(
      `SELECT r.*, e.name as event_name, e.date, e.time, e.venue, e.description
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.user_id = ? 
       ORDER BY r.registration_date DESC`,
      [userId]
    );

    console.log(`Found ${registrations.length} registrations`);
    res.json(registrations);
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get QR code for a registration
const getQRCode = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user.id;
    const db = getDb();

    const registration = await db.get(
      'SELECT * FROM registrations WHERE id = ? AND user_id = ?',
      [registrationId, userId]
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({ qrCode: registration.qr_code });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel registration
const cancelRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const userId = req.user.id;
    const db = getDb();

    const registration = await db.get(
      'SELECT * FROM registrations WHERE id = ? AND user_id = ?',
      [registrationId, userId]
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    await db.run('DELETE FROM registrations WHERE id = ?', [registrationId]);

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all registrations (admin only)
const getAllRegistrations = async (req, res) => {
  try {
    const db = getDb();

    const registrations = await db.all(
      `SELECT r.*, 
        u.name as student_name, 
        u.email as student_email, 
        u.roll_number,
        u.department,
        u.year,
        e.name as event_name,
        e.date as event_date,
        e.venue as event_venue
       FROM registrations r 
       JOIN users u ON r.user_id = u.id 
       JOIN events e ON r.event_id = e.id 
       ORDER BY r.registration_date DESC`
    );

    console.log(`Found ${registrations.length} total registrations for admin`);
    res.json(registrations);
  } catch (error) {
    console.error('Get all registrations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve registration (admin only)
const approveRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const db = getDb();

    const registration = await db.get(
      'SELECT * FROM registrations WHERE id = ?',
      [registrationId]
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    await db.run(
      'UPDATE registrations SET approval_status = ? WHERE id = ?',
      ['approved', registrationId]
    );

    const updated = await db.get(
      'SELECT * FROM registrations WHERE id = ?',
      [registrationId]
    );

    console.log(`Registration ${registrationId} approved by admin`);
    res.json({ message: 'Registration approved successfully', registration: updated });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerForEvent,
  checkRegistration,
  getMyRegistrations,
  getQRCode,
  cancelRegistration,
  getAllRegistrations,
  approveRegistration
};