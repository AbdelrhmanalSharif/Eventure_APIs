// eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middlewares/auth');

// Public routes for all users (including Individuals)
router.get('/', eventController.getAllEvents);
router.get('/categories', eventController.getEventCategories);
router.get('/:id', eventController.getEventById);

module.exports = router;
