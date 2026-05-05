const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  registerForEvent,
  checkRegistration,
  getMyRegistrations,
  getAllRegistrations,
  getQRCode,
  cancelRegistration,
  approveRegistration
} = require('../controllers/registrationController');

// All routes with static path segments first
router.get('/my', protect, getMyRegistrations);
router.get('/all', protect, adminOnly, getAllRegistrations);
router.get('/check/:eventId', protect, checkRegistration);
router.get('/qr/:registrationId', protect, getQRCode);
router.post('/:registrationId/approve', protect, adminOnly, approveRegistration);
router.delete('/:registrationId', protect, cancelRegistration);

// Generic parameterized routes last (lowest priority)
router.post('/:eventId', protect, registerForEvent);

module.exports = router;