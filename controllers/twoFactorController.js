const db = require('../db');
const crypto = require('crypto');
const { sendEmailOtp } = require('../services/emailService');

// Generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate backup codes
const generateBackupCodes = () => {
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex')
  );
};

// 🔹 Send OTP
exports.sendOtp = async (req, res) => {
  const { userId, email } = req.body;

  try {
    const otp = generateOtp();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(
      `INSERT INTO two_factor_auth (user_id, email, otp_code, otp_expires_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       email=?, otp_code=?, otp_expires_at=?`,
      [userId, email, otp, expires, email, otp, expires]
    );

    await sendEmailOtp(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// 🔹 Verify OTP
exports.verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM two_factor_auth WHERE user_id=?',
      [userId]
    );

    const record = rows[0];
    if (!record) return res.status(400).json({ error: 'No OTP found' });

    if (record.otp_code !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > new Date(record.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    const backupCodes = generateBackupCodes();

    await db.query(
      `UPDATE two_factor_auth
       SET is_enabled=1, backup_codes=?, otp_code=NULL
       WHERE user_id=?`,
      [JSON.stringify(backupCodes), userId]
    );

    res.json({
      message: '2FA enabled',
      backupCodes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

// 🔹 Disable 2FA
exports.disable2FA = async (req, res) => {
  const { userId } = req.body;

  try {
    await db.query(
      'UPDATE two_factor_auth SET is_enabled=0, backup_codes=NULL WHERE user_id=?',
      [userId]
    );

    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// 🔹 Regenerate codes
exports.regenerateCodes = async (req, res) => {
  const { userId } = req.body;

  try {
    const codes = generateBackupCodes();

    await db.query(
      'UPDATE two_factor_auth SET backup_codes=? WHERE user_id=?',
      [JSON.stringify(codes), userId]
    );

    res.json({ backupCodes: codes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate codes' });
  }
};