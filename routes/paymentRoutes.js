const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Individual users only
router.post('/', authenticateToken, authorizeRole(['Individual']), paymentController.createPayment);
router.get('/', authenticateToken, authorizeRole(['Individual']), paymentController.getUserPayments);

module.exports = router;
