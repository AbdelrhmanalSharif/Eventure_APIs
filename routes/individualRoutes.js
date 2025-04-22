const express = require('express');
const router = express.Router();
const individualController = require('../controllers/individualController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Only Individual users can access these routes
router.post('/', authenticateToken, authorizeRole(['Individual']), individualController.createEvent);
router.get('/', authenticateToken, authorizeRole(['Individual']), individualController.getMyEvents);
router.put('/:id', authenticateToken, authorizeRole(['Individual']), individualController.updateEvent);
router.delete('/:id', authenticateToken, authorizeRole(['Individual']), individualController.deleteEvent);

module.exports = router;
