// routes/userRoutes.js
const { Router } = require('express');
const router = Router();
const userController = require('../controllers/userController');

router.post('/api/users/register', userController.registerPatient);
router.post('/api/users/login', userController.loginUser);

module.exports = router;