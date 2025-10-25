const { Router } = require('express');
const router = Router();
const healthRecordController = require('../controllers/healthRecordController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Create record - provider only (enforced in controller)
router.post('/api/healthrecords/create', authenticateToken, healthRecordController.createHealthRecord);

// Patient: get my records
router.get('/api/healthrecords/me', authenticateToken, healthRecordController.getMyRecords);

// Provider: get records for a patient
router.get('/api/healthrecords/patient/:patient_id', authenticateToken, healthRecordController.getRecordsForPatient);

// Get single record
router.get('/api/healthrecords/:record_id', authenticateToken, healthRecordController.getRecordById);

// Get appointments for a specific patient
router.get('/api/healthrecords/patient-appointments/:patient_id', authenticateToken, healthRecordController.getAppointmentsForPatient);
router.get('/api/health-records/appointment/:appointment_id/:patient_id', authenticateToken, healthRecordController.getHealthRecordForPatientByAppointmentId);
router.get('/api/health-records/doctor-records', authenticateToken, healthRecordController.getHealthRecordsByDoctor);

module.exports = router;
