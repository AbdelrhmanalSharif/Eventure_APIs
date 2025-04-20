const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Company-only: Create Ad
router.post(
  '/',
  authenticateToken,
  authorizeRole(['Company']),
  adController.createAd
);

// Public: Get Active Ads (available to all users)
router.get('/active', adController.getActiveAds);

// Admin-only: View all Ads
router.get(
  '/',
  authenticateToken,
  authorizeRole(['Admin']),
  adController.getAllAds
);

module.exports = router;
