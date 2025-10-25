const { Router } = require('express');
const router = Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const consentController = require('../controllers/consentController');

// Patient routes
router.get('/api/consents/doctors-consent-requests', authenticateToken, consentController.getConsentDoctorsRequests);
router.get('/active-consents', authenticateToken, consentController.getActiveConsents);
router.post('/consent-requests/:consentId/:action', authenticateToken, consentController.handleConsentRequest);
router.post('/consents/:consentId/revoke', authenticateToken, consentController.revokeConsent);

// Doctor routes
router.post('/api/consents/create', authenticateToken, consentController.createConsentRequest);


module.exports = router;