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
    await db.query(
      `UPDATE events
       SET status = 'inactive'
       WHERE status = 'active'
         AND register_till IS NOT NULL
         AND (register_till::text || ' ' || COALESCE(register_till_time, '23:59:59'))::timestamp <= CURRENT_TIMESTAMP`
    );

    const eventsResult = isAdmin
      ? await db.query('SELECT * FROM events ORDER BY date ASC')
      : await db.query("SELECT * FROM events WHERE status = 'active' ORDER BY date ASC");
    const events = eventsResult.rows;
    
    // Get registration count for each event
    for (let event of events) {
      const countResult = await db.query(
        'SELECT COUNT(*)::int as count FROM registrations WHERE event_id = $1',
        [event.id]
      );
      event.registeredCount = countResult.rows[0].count;
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
    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const event = eventResult.rows[0];
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const countResult = await db.query(
      'SELECT COUNT(*)::int as count FROM registrations WHERE event_id = $1',
      [event.id]
    );
    event.registeredCount = countResult.rows[0].count;
    
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
    
    const result = await db.query(
      `INSERT INTO events (name, description, category, venue, capacity, date, register_till, register_till_time, time, coordinator, coordinator_email) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
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

    res.status(201).json(result.rows[0]);
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
    
    await db.query(
      `UPDATE events 
       SET name = $1, description = $2, category = $3, venue = $4, capacity = $5, 
         date = $6, register_till = $7, register_till_time = $8, time = $9, coordinator = $10, coordinator_email = $11
       WHERE id = $12`,
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

    const eventResult = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    res.json(eventResult.rows[0]);
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
    await db.query('DELETE FROM registrations WHERE event_id = $1', [req.params.id]);
    await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getEvents, getEventById, createEvent, updateEvent, deleteEvent };