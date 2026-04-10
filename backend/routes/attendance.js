const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { scanQR, getAttendance } = require('../controllers/attendanceController');

// QR scan endpoint (admin only)
router.post('/scan', protect, adminOnly, scanQR);

// Get attendance for event (admin only)
router.get('/:eventId', protect, adminOnly, getAttendance);

module.exports = router;