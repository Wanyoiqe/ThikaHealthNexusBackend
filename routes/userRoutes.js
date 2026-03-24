// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/api/users/register', userController.registerPatient);
router.post('/api/users/login', userController.loginUser);
router.get('/api/users/fetch_profile', authenticateToken, userController.fetchProfile);

module.exports = router;