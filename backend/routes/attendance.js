const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { scanQR, getAttendance } = require('../controllers/attendanceController');

// QR scan endpoint - allows students to scan their QR codes
router.post('/scan', protect, scanQR);

// Get attendance for event (admin only)
router.get('/:eventId', protect, adminOnly, getAttendance);

module.exports = router;