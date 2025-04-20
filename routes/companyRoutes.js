const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');

// Ensure only logged-in Company users can access
const companyOnly = [authenticateToken, authorizeRole(['Company'])];

// Create new event
router.post('/events', companyOnly, companyController.createCompanyEvent);

// Get all events created by this company
router.get('/events', companyOnly, companyController.getCompanyEvents);

// Update a specific event
router.put('/events/:id', companyOnly, companyController.updateCompanyEvent);

// Delete a specific event
router.delete('/events/:id', companyOnly, companyController.deleteCompanyEvent);

module.exports = router;
