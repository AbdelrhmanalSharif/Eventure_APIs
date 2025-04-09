const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes - require authentication
router.get('/profile', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, userController.updateUserProfile);
router.post('/change-password', authenticateToken, userController.changePassword);

// Admin-only routes
router.get('/all', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    // Admin-only endpoint to get all users
    const { poolPromise, sql } = require('../config/database');
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT UserID, FullName, Email, UserType, CreatedAt FROM Users');
    
    res.status(200).json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

module.exports = router;