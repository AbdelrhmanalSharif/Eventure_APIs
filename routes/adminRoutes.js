const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

router.get('/users', authenticateToken, isAdmin, adminController.getAllUsers);
router.get('/events', authenticateToken, isAdmin, adminController.getAllEvents);
router.get('/stats', authenticateToken, isAdmin, adminController.getPlatformStats);
router.delete('/users/:id', authenticateToken, isAdmin, adminController.deleteUser);
router.delete('/events/:id', authenticateToken, isAdmin, adminController.deleteEvent);

module.exports = router;
