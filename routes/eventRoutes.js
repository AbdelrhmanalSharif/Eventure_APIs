const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/categories', eventController.getEventCategories);
router.get('/search', eventController.searchEvents);
router.get('/:id', eventController.getEventById);

// Protected routes - require authentication
router.post('/', authenticateToken, authorizeRole(['Company', 'Admin']), eventController.createEvent);
router.put('/:id', authenticateToken, eventController.updateEvent);
router.delete('/:id', authenticateToken, eventController.deleteEvent);

// Event images routes
router.post('/:id/images', authenticateToken, eventController.addEventImage);
router.delete('/:id/images/:imageId', authenticateToken, eventController.deleteEventImage);

module.exports = router;