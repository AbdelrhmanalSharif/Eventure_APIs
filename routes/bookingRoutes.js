const express = require('express');
const router = express.Router();
const { bookEvent, getMyBookings } = require('../controllers/bookingController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, bookEvent);
router.get('/', authenticateToken, getMyBookings);

module.exports = router;
