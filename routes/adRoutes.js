const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, adController.createAd);
router.get('/', authenticateToken, adController.getAllAds);
router.get('/active', adController.getActiveAds);

module.exports = router;
