const { User, Provider, Patient, Consent, HealthRecord, Notification } = require('../models');
const { Op } = require('sequelize');
const { sendConsentRequestEmail } = require('../utils/consentEmail');

// Helper — get doctor full name from provider record
const getProviderName = async (provider_id) => {
  const provider = await Provider.findOne({
    where: { provider_id },
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
  });
  if (!provider || !provider.user) return 'Your Doctor';
  return `${provider.user.first_name} ${provider.user.last_name}`;
};

// GET /api/consents/doctors-consent-requests — doctor sees all requests they sent
exports.getConsentDoctorsRequests = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access consent requests' });

    const requests = await Consent.findAll({
      where: { provider_id: provider.provider_id },
      order: [['request_date', 'DESC']],
    });

    const patientIds = [...new Set(requests.map(r => r.patient_id))];
    const patients = await Patient.findAll({ where: { patient_id: patientIds }, attributes: ['patient_id', 'name'] });
    const patientMap = patients.reduce((acc, p) => { acc[p.patient_id] = p.name; return acc; }, {});

    const formatted = requests.map(r => ({
      id: r.consent_id,
      patient_id: r.patient_id,
      patient_name: patientMap[r.patient_id] || 'Unknown',
      health_record_id: r.health_record_id,
      type: r.type,
      purpose: r.purpose,
      status: r.status,
      request_date: r.request_date,
      response_date: r.response_date,
      expiry_date: r.expiry_date,
    }));

    return res.status(200).json({ result_code: 1, consents: formatted });
  } catch (err) {
    return next(err);
  }
};

// GET /api/consents/active — patient's approved + non-expired consents
exports.getActiveConsents = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient record not found' });

    const activeConsents = await Consent.findAll({
      where: { patient_id: patient.patient_id, status: 'approved', expiry_date: { [Op.gt]: new Date() } },
      order: [['response_date', 'DESC']],
    });

    const formatted = await Promise.all(activeConsents.map(async (c) => ({
      id: c.consent_id,
      provider_id: c.provider_id,
      doctor_name: await getProviderName(c.provider_id),
      type: c.type,
      purpose: c.purpose,
      granted_date: c.response_date,
      expiry_date: c.expiry_date,
    })));

    return res.status(200).json({ result_code: 1, consents: formatted });
  } catch (err) {
    return next(err);
  }
};

// GET /api/consents/my-history — patient's full consent history (all statuses)
exports.getMyConsentHistory = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient record not found' });

    const consents = await Consent.findAll({
      where: { patient_id: patient.patient_id },
      order: [['request_date', 'DESC']],
    });

    const formatted = await Promise.all(consents.map(async (c) => ({
      id: c.consent_id,
      provider_id: c.provider_id,
      doctor_name: await getProviderName(c.provider_id),
      health_record_id: c.health_record_id,
      type: c.type,
      purpose: c.purpose,
      status: c.status,
      request_date: c.request_date,
      response_date: c.response_date,
      expiry_date: c.expiry_date,
    })));

    return res.status(200).json({ result_code: 1, consents: formatted });
  } catch (err) {
    return next(err);
  }
};

// POST /api/consents/:consentId/respond — patient approves or denies
exports.handleConsentRequest = async (req, res, next) => {
  try {
    const { consentId } = req.params;
    const { action } = req.body;
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient record not found' });

    const consent = await Consent.findOne({
      where: { consent_id: consentId, patient_id: patient.patient_id, status: 'pending' },
    });
    if (!consent) return res.status(404).json({ result_code: 0, message: 'Consent request not found or already actioned' });

    const status = action === 'approve' ? 'approved' : 'denied';
    const expiry_date = action === 'approve' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    await consent.update({ status, response_date: new Date(), expiry_date });

    // Clear pending flag if no more pending consents
    const remaining = await Consent.count({ where: { patient_id: patient.patient_id, status: 'pending' } });
    if (remaining === 0) await patient.update({ has_pending_consent: false });

    // Notify the doctor
    try {
      const provider = await Provider.findOne({ where: { provider_id: consent.provider_id } });
      if (provider) {
        await Notification.create({
          user_id: provider.user_id,
          type: status === 'approved' ? 'consent_approved' : 'consent_denied',
          title: `Consent Request ${status === 'approved' ? 'Approved' : 'Denied'}`,
          message: `${patient.name} has ${status} your request to access health records.`,
          related_id: consentId,
          related_type: 'consent',
        });
      }
    } catch (notifErr) {
      console.warn('Failed to create consent notification:', notifErr.message);
    }

    return res.status(200).json({ result_code: 1, message: `Consent ${status}` });
  } catch (err) {
    return next(err);
  }
};

// POST /api/consents/:consentId/revoke — patient revokes approved consent
exports.revokeConsent = async (req, res, next) => {
  try {
    const { consentId } = req.params;
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient record not found' });

    const consent = await Consent.findOne({
      where: { consent_id: consentId, patient_id: patient.patient_id, status: 'approved' },
    });
    if (!consent) return res.status(404).json({ result_code: 0, message: 'Active consent not found' });

    await consent.update({ status: 'revoked', response_date: new Date(), expiry_date: new Date() });
    return res.status(200).json({ result_code: 1, message: 'Consent revoked successfully' });
  } catch (err) {
    return next(err);
  }
};

// POST /api/consents/create — doctor requests consent from a patient
exports.createConsentRequest = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can create consent requests' });

    const { patient_id, record_id, purpose, type } = req.body;
    if (!patient_id || !record_id || !purpose) {
      return res.status(400).json({ result_code: 0, message: 'patient_id, record_id, and purpose are required' });
    }

    const patient = await Patient.findOne({ where: { patient_id } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient not found' });

    // Prevent duplicate pending request for the same record
    const existing = await Consent.findOne({
      where: { provider_id: provider.provider_id, patient_id, health_record_id: record_id, status: 'pending' },
    });
    if (existing) {
      return res.status(200).json({ result_code: 1, message: 'Consent request already pending', consentId: existing.consent_id });
    }

    const consent = await Consent.create({
      provider_id: provider.provider_id,
      patient_id,
      health_record_id: record_id,
      type: type || null,
      purpose,
      request_date: new Date(),
      status: 'pending',
    });

    await patient.update({ has_pending_consent: true });

    // Email the patient
    try {
      const patientUser = await User.findOne({ where: { user_id: patient.user_id }, attributes: ['email', 'first_name', 'last_name'] });
      if (patientUser) {
        await sendConsentRequestEmail({
          patientEmail: patientUser.email,
          patientName: `${patientUser.first_name} ${patientUser.last_name}`,
          doctorName: `${req.user.first_name} ${req.user.last_name}`,
          purpose,
        });
      }
    } catch (emailErr) {
      console.warn('Failed to send consent email:', emailErr.message);
    }

    return res.status(201).json({ result_code: 1, message: 'Consent request created', consentId: consent.consent_id });
  } catch (err) {
    return next(err);
  }
};

// GET /api/consents/:consentId/records — view health record linked to a consent
exports.getConsentRecords = async (req, res, next) => {
  try {
    const { consentId } = req.params;
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const consent = await Consent.findOne({ where: { consent_id: consentId } });
    if (!consent) return res.status(404).json({ result_code: 0, message: 'Consent not found' });
    if (consent.status !== 'approved') {
      return res.status(403).json({ result_code: 0, message: 'Access denied — consent is not approved' });
    }

    const patient = await Patient.findOne({ where: { patient_id: consent.patient_id } });
    const provider = await Provider.findOne({ where: { provider_id: consent.provider_id } });
    const isPatient = patient && patient.user_id === userId;
    const isProvider = provider && provider.user_id === userId;
    if (!isPatient && !isProvider) return res.status(403).json({ result_code: 0, message: 'Forbidden' });

    const record = await HealthRecord.findOne({ where: { record_id: consent.health_record_id, is_active: true } });
    if (!record) return res.status(404).json({ result_code: 0, message: 'Health record not found' });

    return res.status(200).json({ result_code: 1, record });
  } catch (err) {
    return next(err);
  }
};
