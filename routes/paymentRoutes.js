const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, paymentController.createPayment);
router.get('/', authenticateToken, paymentController.getUserPayments);

module.exports = router;