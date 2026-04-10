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

router.post('/:eventId', protect, registerForEvent);
router.get('/check/:eventId', protect, checkRegistration);
router.get('/my', protect, getMyRegistrations);
router.get('/all', protect, adminOnly, getAllRegistrations); // Admin only
router.get('/qr/:registrationId', protect, getQRCode);
router.post('/:registrationId/approve', protect, adminOnly, approveRegistration); // Admin only
router.delete('/:registrationId', protect, cancelRegistration);

module.exports = router;