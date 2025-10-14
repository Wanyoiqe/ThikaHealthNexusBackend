// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');

router.post('/api/users/register', userController.registerPatient);
router.post('/api/users/login', userController.loginUser);
router.post('/api/users/fetch_all_doctors', userController.getAllDoctors);

module.exports = router;