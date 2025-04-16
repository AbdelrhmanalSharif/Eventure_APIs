const express = require('express');
const router = express.Router();

router.use('/users', require('./userRoutes'));
router.use('/events', require('./eventRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/recommendations', require('./recommendationRoutes'));
router.use('/ads', require('./adRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;