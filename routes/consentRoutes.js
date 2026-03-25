const { Router } = require('express');
const router = Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const consentController = require('../controllers/consentController');

// Doctor routes
router.get('/api/consents/doctors-consent-requests', authenticateToken, consentController.getConsentDoctorsRequests);
router.post('/api/consents/create', authenticateToken, consentController.createConsentRequest);
router.get('/api/consents/:consentId/records', authenticateToken, consentController.getConsentRecords);

// Patient routes
router.get('/api/consents/active', authenticateToken, consentController.getActiveConsents);
router.get('/api/consents/my-history', authenticateToken, consentController.getMyConsentHistory);
router.post('/api/consents/:consentId/respond', authenticateToken, consentController.handleConsentRequest);
router.post('/api/consents/:consentId/revoke', authenticateToken, consentController.revokeConsent);

module.exports = router;
