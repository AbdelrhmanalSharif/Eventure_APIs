const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, recommendationController.addRecommendation);
router.get('/', authenticateToken, recommendationController.getRecommendationsForUser);

//Behavioral recommendation
router.get('/behavioral', authenticateToken, recommendationController.getBehavioralRecommendations);

module.exports = router;
