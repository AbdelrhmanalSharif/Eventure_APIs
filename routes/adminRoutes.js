const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// 🔒 All routes require valid token + admin check
router.use(authenticateToken, isAdmin);

// 👥 Get all non-admin users grouped by type
router.get('/users', adminController.getAllUsers);

// 📅 Get all events with categories and images
router.get('/events', adminController.getAllEvents);

// 📊 Get platform statistics
router.get('/stats', adminController.getPlatformStats);

// ❌ Delete a user by ID
router.delete('/users/:id', adminController.deleteUser);

// ❌ Delete an event by ID
router.delete('/events/:id', adminController.deleteEvent);

// 🖼️ Delete an event image (admin-level)
router.delete('/events/images/:imageId', eventController.deleteEventImage);

module.exports = router;
