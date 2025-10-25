const { Router } = require('express');
const router = Router();
const healthRecordController = require('../controllers/healthRecordController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Create record - provider only (enforced in controller)
router.post('/api/healthrecords', authenticateToken, healthRecordController.createHealthRecord);

// Patient: get my records
router.get('/api/healthrecords/me', authenticateToken, healthRecordController.getMyRecords);

// Provider: get records for a patient
router.get('/api/healthrecords/patient/:patient_id', authenticateToken, healthRecordController.getRecordsForPatient);

// Get single record
router.get('/api/healthrecords/:record_id', authenticateToken, healthRecordController.getRecordById);

module.exports = router;
