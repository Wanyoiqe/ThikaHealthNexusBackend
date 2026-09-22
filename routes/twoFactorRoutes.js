const express = require('express');
const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  disable2FA,
  regenerateCodes,
} = require('../controllers/twoFactorController');

router.post('/2fa/send-otp', sendOtp);
router.post('/2fa/verify', verifyOtp);
router.post('/2fa/disable', disable2FA);
router.post('/2fa/regenerate', regenerateCodes);

module.exports = router;