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

router.delete(
  "/:eventId",
  authenticateToken,
  authorizeRole(["Individual"]),
  bookingController.cancelBooking
);

//get all bookings for admin
router.get(
  "/all",
  authenticateToken,
  authorizeRole(["Admin"]),
  bookingController.getAllBookings
);

//get all booked users for a specific event for any user
router.get("/bookings/:eventId", bookingController.getBookedUserForEvent);

//verify if the user has booked the event
router.get(
  "/verify/:eventId",
  authenticateToken,
  authorizeRole(["Individual"]),
  bookingController.verifyBooking
);

module.exports = router;
