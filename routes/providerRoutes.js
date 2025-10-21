const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Add new doctor
router.post('/api/providers/registerDoctor', authenticateToken, providerController.addDoctor)




router.get('/api/providers/fetch_all_doctors', userController.getAllDoctors);


module.exports = router;
