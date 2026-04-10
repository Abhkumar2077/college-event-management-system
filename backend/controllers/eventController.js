const { getDb } = require('../database/database');

const buildClosingDateTime = (registerTill, registerTillTime) => {
  if (!registerTill) return null;
  return new Date(`${registerTill}T${registerTillTime || '23:59'}:00`);
};

const buildEventDateTime = (eventDate, eventTime) => {
  if (!eventDate) return null;
  return new Date(`${eventDate}T${eventTime || '23:59'}:00`);
};

// @desc    Get all events
// @route   GET /api/events
const getEvents = async (req, res) => {
  try {
    const db = getDb();
    const isAdmin = req.user?.role === 'admin';

    // Auto-expire events whose registration deadline has passed.
    await db.run(
      `UPDATE events
       SET status = 'inactive'
       WHERE status = 'active'
         AND register_till IS NOT NULL
         AND datetime(register_till || ' ' || COALESCE(register_till_time, '23:59:59')) <= datetime('now', 'localtime')`
    );

    const events = isAdmin
      ? await db.all('SELECT * FROM events ORDER BY date ASC')
      : await db.all('SELECT * FROM events WHERE status = "active" ORDER BY date ASC');
    
    // Get registration count for each event
    for (let event of events) {
      const count = await db.get(
        'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
        [event.id]
      );
      event.registeredCount = count.count;
    }
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const db = getDb();
    const event = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const count = await db.get(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
      [event.id]
    );
    event.registeredCount = count.count;
    
    res.json(event);
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create event
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      venue,
      capacity,
      date,
      register_till,
      register_till_time,
      time,
      coordinator,
      coordinator_email
    } = req.body;
    const db = getDb();

    const registrationCloseAt = buildClosingDateTime(register_till, register_till_time);
    const eventStartsAt = buildEventDateTime(date, time);

    if (registrationCloseAt && eventStartsAt && registrationCloseAt > eventStartsAt) {
      return res.status(400).json({ message: 'Register close date and time cannot be after event start date and time' });
    }
    
    const result = await db.run(
      `INSERT INTO events (name, description, category, venue, capacity, date, register_till, register_till_time, time, coordinator, coordinator_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        category,
        venue,
        capacity,
        date,
        register_till,
        register_till_time || '23:59',
        time,
        coordinator,
        coordinator_email
      ]
    );
    
    const event = await db.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      venue,
      capacity,
      date,
      register_till,
      register_till_time,
      time,
      coordinator,
      coordinator_email
    } = req.body;
    const db = getDb();

    const registrationCloseAt = buildClosingDateTime(register_till, register_till_time);
    const eventStartsAt = buildEventDateTime(date, time);

    if (registrationCloseAt && eventStartsAt && registrationCloseAt > eventStartsAt) {
      return res.status(400).json({ message: 'Register close date and time cannot be after event start date and time' });
    }
    
    await db.run(
      `UPDATE events 
       SET name = ?, description = ?, category = ?, venue = ?, capacity = ?, 
           date = ?, register_till = ?, register_till_time = ?, time = ?, coordinator = ?, coordinator_email = ?
       WHERE id = ?`,
      [
        name,
        description,
        category,
        venue,
        capacity,
        date,
        register_till,
        register_till_time || '23:59',
        time,
        coordinator,
        coordinator_email,
        req.params.id
      ]
    );
    
    const event = await db.get('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const db = getDb();
    
    // Delete registrations first
    await db.run('DELETE FROM registrations WHERE event_id = ?', [req.params.id]);
    await db.run('DELETE FROM events WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };