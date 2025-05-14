const express = require("express");
const router = express.Router();

// Route modules
const userRoutes = require("./userRoutes");
const eventRoutes = require("./eventRoutes");
const individualRoutes = require("./individualRoutes");
const adminRoutes = require("./adminRoutes");
const companyRoutes = require("./companyRoutes");
const searchRoutes = require("./searchRoutes");
const bookingRoutes = require("./bookingRoutes");
const paymentRoutes = require("./paymentRoutes");
const reviewRoutes = require("./reviewRoutes");
const adRoutes = require("./adRoutes");
const recommendationRoutes = require("./recommendationRoutes");
const feedbackRoutes = require("./feedbackRoutes");

// Use routes with appropriate base paths
router.use("/users", userRoutes);
router.use("/events", eventRoutes);
router.use("/individual", individualRoutes);
router.use("/admin", adminRoutes);
router.use("/company", companyRoutes);
router.use("/search", searchRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/ads", adRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/feedback", feedbackRoutes);

module.exports = router;
