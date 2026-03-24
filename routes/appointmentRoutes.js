const { Router } = require('express');
const router = Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/api/appointments/book', authenticateToken, appointmentController.bookAppointment);
router.post('/api/appointments/available', appointmentController.getAvailableDoctors);
router.get('/api/appointments/upcoming', authenticateToken, appointmentController.getUpcoming);
router.get('/api/appointments/past', authenticateToken, appointmentController.getPast);
router.get('/api/appointments/all', authenticateToken, appointmentController.getAllAppointments);

// Doctor-scoped routes
router.get('/api/appointments/doctor/all', authenticateToken, appointmentController.getDoctorAll);
router.get('/api/appointments/doctor/upcoming', authenticateToken, appointmentController.getDoctorUpcoming);
router.get('/api/appointments/doctor/past', authenticateToken, appointmentController.getDoctorPast);
router.patch('/api/appointments/:app_id/status', authenticateToken, appointmentController.updateAppointmentStatus);

module.exports = router;
