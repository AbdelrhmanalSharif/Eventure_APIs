const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// All routes below require the user to be authenticated and of type 'Individual'

router.post(
  '/',
  authenticateToken,
  authorizeRole(['Individual']),
  bookingController.bookEvent
);

router.get(
  '/',
  authenticateToken,
  authorizeRole(['Individual']),
  bookingController.getUserBookings
);

router.delete(
  '/:eventId',
  authenticateToken,
  authorizeRole(['Individual']),
  bookingController.cancelBooking
);

module.exports = router;
