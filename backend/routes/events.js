const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

router.route('/')
  .get(protect, getEvents)
  .post(protect, adminOnly, createEvent);

router.route('/:id')
  .get(protect, getEventById)
  .put(protect, adminOnly, updateEvent)
  .delete(protect, adminOnly, deleteEvent);

module.exports = router;