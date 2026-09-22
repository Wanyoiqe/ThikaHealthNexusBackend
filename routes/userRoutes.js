// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../utils/multer');

// Public routes
router.post('/api/users/register', userController.registerPatient);
router.post('/api/users/login', userController.loginUser);

// Protected routes (require authentication)
router.get('/api/users/fetch_profile', authenticateToken, userController.fetchProfile);
router.put('/api/users/profile', authenticateToken, userController.updateProfile);
router.post('/api/users/upload_picture', authenticateToken, upload.single('profile_pic'), userController.uploadProfilePicture);

// Admin only routes
router.post('/api/users/admin/create', authenticateToken, userController.adminCreateUser);

// Get all doctors (can be public or protected)
router.get('/api/users/doctors', userController.getAllDoctors);

module.exports = router;