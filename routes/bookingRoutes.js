const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken, authorizeRole } = require("../middlewares/auth");

// All routes below require the user to be authenticated and of type 'Individual'

router.post(
  "/",
  authenticateToken,
  authorizeRole(["Individual"]),
  bookingController.bookEvent
);

router.get(
  "/",
  authenticateToken,
  authorizeRole(["Individual"]),
  bookingController.getUserBookings
);

router.delete("/:bookingId", authenticateToken, bookingController.cancelBooking);

//get all bookings for admin
router.get(
  "/all",
  authenticateToken,
  authorizeRole(["Admin"]),
  bookingController.getAllBookings
);

//get all bookings for a specific event
router.get(
  "/event/:eventId",
  authenticateToken,
  bookingController.getBookingsByEventId
);

//verify if the user has booked the event
router.get(
  "/verify/:eventId",
  authenticateToken,
  authorizeRole(["Individual"]),
  bookingController.verifyBooking
);

router.get(
  "/availableTickets/:eventId",
  bookingController.getNbOfAvailableTickets
);

module.exports = router;
