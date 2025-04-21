// eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public routes for all users (including Individuals)
router.get('/', eventController.getAllEvents);
router.get('/categories', eventController.getEventCategories);
router.get('/:id', eventController.getEventById);
router.post(
    '/:id/images/multiple',
    authenticateToken,
    authorizeRole(['Company']),
    upload.multiple,
    eventController.uploadMultipleEventImages
  );

module.exports = router;
