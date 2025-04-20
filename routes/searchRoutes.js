const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Admin-only global search
router.get('/global', authenticateToken, authorizeRole(['Admin']), searchController.globalSearch);

module.exports = router;
