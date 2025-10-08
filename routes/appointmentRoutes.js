const { Router } = require('express');
const router = Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/api/appointments/book', authenticateToken, appointmentController.bookAppointment);
router.post('/api/appointments/available', appointmentController.getAvailableDoctors);
router.get('/api/appointments/upcoming', authenticateToken, appointmentController.getUpcoming);
router.get('/api/appointments/past', authenticateToken, appointmentController.getPast);
router.get('/api/appointments/all', authenticateToken, appointmentController.getAllAppointments);

module.exports = router;
