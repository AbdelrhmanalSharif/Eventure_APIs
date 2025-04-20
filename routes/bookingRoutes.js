const express = require("express");
const router = express.Router();
const {
  bookEvent,
  getUserBookings,
} = require("../controllers/bookingController");
const { authenticateToken } = require("../middlewares/auth");

router.post("/", authenticateToken, bookEvent);
router.get("/", authenticateToken, getUserBookings);

module.exports = router;
