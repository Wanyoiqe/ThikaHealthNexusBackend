const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Existing routes
router.post('/api/providers/registerDoctor', authenticateToken, providerController.addDoctor);
router.get('/api/providers/fetch_all_doctors', userController.getAllDoctors);
router.get('/api/providers/fetch_doctors_patients', authenticateToken, providerController.getDoctorsPatients);
router.get('/api/providers/dashboard_details', authenticateToken, providerController.getReceptionistDashboardDetails);

// ============= NEW ROUTES - ADD THESE =============
// Update doctor (PUT request)
router.put('/api/providers/:providerId', authenticateToken, providerController.updateDoctor);

// Delete doctor (DELETE request)
router.delete('/api/providers/:providerId', authenticateToken, providerController.deleteDoctor);

// Get single doctor (GET request)
router.get('/api/providers/:providerId', authenticateToken, providerController.getDoctorById);

module.exports = router;