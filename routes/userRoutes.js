// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../utils/multer');

router.post('/api/users/register', userController.registerPatient);
router.post('/api/users/login', userController.loginUser);
router.get('/api/users/fetch_profile', authenticateToken, userController.fetchProfile);
router.put('/api/users/profile', authenticateToken, userController.updateProfile);
router.post('/api/users/upload_picture', authenticateToken, upload.single('profile_pic'), userController.uploadProfilePicture);

module.exports = router;