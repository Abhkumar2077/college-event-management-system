const { getDb } = require('../database/database');

const buildClosingDateTime = (registerTill, registerTillTime) => {
  if (!registerTill) return null;
  return new Date(`${registerTill}T${registerTillTime || '23:59'}:00`);
};

const buildEventDateTime = (eventDate, eventTime) => {
  if (!eventDate) return null;
  return new Date(`${eventDate}T${eventTime || '23:59'}:00`);
};

const isRegistrationClosed = (event) => {
  if (!event?.register_till) return false;
  const closeAt = new Date(`${event.register_till}T${event.register_till_time || '23:59'}:00`);
  return !Number.isNaN(closeAt.getTime()) && new Date() >= closeAt;
};

const getRegistrationCount = async (db, eventId) => {
  try {
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1',
      [eventId]
    );
    return Number(countResult.rows[0]?.count || 0);
  } catch (error) {
    console.warn(`Registration count unavailable for event ${eventId}:`, error.message);
    return 0;
  }
};

// @desc    Get all events
// @route   GET /api/events
const getEvents = async (req, res) => {
  try {
    const db = getDb();
    // Safely check if user is admin (user might not exist for public routes)
    const isAdmin = req.user && req.user.role === 'admin';
    
    console.log('Fetching events. IsAdmin:', isAdmin);
    
    let eventsResult;
    try {
      eventsResult = await db.query('SELECT * FROM events ORDER BY date ASC');
    } catch (queryError) {
      console.warn('Ordered event query failed, falling back to unordered list:', queryError.message);
      eventsResult = await db.query('SELECT * FROM events');
    }

    const events = eventsResult.rows.sort((left, right) => {
      const leftDate = left.date ? new Date(left.date).getTime() : Number.POSITIVE_INFINITY;
      const rightDate = right.date ? new Date(right.date).getTime() : Number.POSITIVE_INFINITY;

      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      return Number(left.id || 0) - Number(right.id || 0);
    });

    // Keep event status in sync
    for (const event of events) {
      if (event.status === 'active' && isRegistrationClosed(event)) {
        try {
          await db.query("UPDATE events SET status = 'inactive' WHERE id = $1", [event.id]);
          event.status = 'inactive';
        } catch (error) {
          console.warn(`Unable to auto-expire event ${event.id}:`, error.message);
        }
      }
    }

    const visibleEvents = isAdmin ? events : events.filter((event) => (event.status || 'active') === 'active');
    
    // Get registration count for each event
    for (const event of visibleEvents) {
      event.registeredCount = await getRegistrationCount(db, event.id);
    }
    
    res.json(visibleEvents);
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
    
    event.registeredCount = await getRegistrationCount(db, event.id);
    
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