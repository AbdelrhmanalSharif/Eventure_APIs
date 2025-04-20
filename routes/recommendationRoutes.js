const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middlewares/auth');

// Add a recommendation (manual)
router.post('/', authenticateToken, recommendationController.addRecommendation);

// Get all recommendations made by the user
router.get('/', authenticateToken, recommendationController.getRecommendationsForUser);

// Get behavioral-based recommendations
router.get('/behavioral', authenticateToken, recommendationController.getBehavioralRecommendations);

module.exports = router;
