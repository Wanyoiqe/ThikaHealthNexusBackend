const { User, Provider, Patient, Consent } = require('../models');
const { Op } = require('sequelize');

// Get all consent requests for a patient
exports.getConsentDoctorsRequests = async (req, res) => {
  try {
    // const patientId = req.user.patient.patient_id; // Assuming we have user data from auth middleware
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access consent requests' });
    
    const requests = await Consent.findAll({
      where: {
        provider_id: provider.provider_id,
        status: 'pending'
      },
      order: [['request_date', 'DESC']]
    });

    const formattedRequests = requests.map(request => ({
      id: request.consent_id,
      doctorId: request.provider_id,
      doctorName: `${request.provider.user.first_name} ${request.provider.user.last_name}`,
      specialization: request.provider.specialization,
      requestDate: request.request_date,
      purpose: request.purpose,
      status: request.status
    }));

    res.status(200).json(formattedRequests);
  } catch (error) {
    console.error('Error fetching consent requests:', error);
    res.status(500).json({ message: 'Failed to fetch consent requests' });
  }
};

// Get active consents for a patient
exports.getActiveConsents = async (req, res) => {
  try {
    const patientId = req.user.patient.patient_id;

    const activeConsents = await Consent.findAll({
      where: {
        patient_id: patientId,
        status: 'approved',
        expiry_date: {
          [Op.gt]: new Date() // Only get non-expired consents
        }
      },
      include: [{
        model: Provider,
        include: [{
          model: User,
          attributes: ['first_name', 'last_name']
        }]
      }],
      order: [['response_date', 'DESC']]
    });

    const formattedConsents = activeConsents.map(consent => ({
      id: consent.consent_id,
      doctorId: consent.provider_id,
      doctorName: `${consent.provider.user.first_name} ${consent.provider.user.last_name}`,
      specialization: consent.provider.specialization,
      grantedDate: consent.response_date,
      expiryDate: consent.expiry_date
    }));

    res.status(200).json(formattedConsents);
  } catch (error) {
    console.error('Error fetching active consents:', error);
    res.status(500).json({ message: 'Failed to fetch active consents' });
  }
};

// Handle consent request (approve/deny)
exports.handleConsentRequest = async (req, res) => {
  try {
    const { consentId } = req.params;
    const { action } = req.body;
    const patientId = req.user.patient.patient_id;

    const consent = await Consent.findOne({
      where: {
        consent_id: consentId,
        patient_id: patientId,
        status: 'pending'
      }
    });

    if (!consent) {
      return res.status(404).json({ message: 'Consent request not found' });
    }

    const status = action === 'approve' ? 'approved' : 'denied';
    const expiryDate = action === 'approve' 
      ? new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days from now
      : null;

    await consent.update({
      status,
      response_date: new Date(),
      expiry_date: expiryDate
    });

    res.status(200).json({ message: `Consent request ${status}` });
  } catch (error) {
    console.error('Error handling consent request:', error);
    res.status(500).json({ message: 'Failed to handle consent request' });
  }
};

// Revoke consent
exports.revokeConsent = async (req, res) => {
  try {
    const { consentId } = req.params;
    const patientId = req.user.patient.patient_id;

    const consent = await Consent.findOne({
      where: {
        consent_id: consentId,
        patient_id: patientId,
        status: 'approved'
      }
    });

    if (!consent) {
      return res.status(404).json({ message: 'Active consent not found' });
    }

    await consent.update({
      status: 'revoked',
      response_date: new Date(),
      expiry_date: new Date() // Set expiry to now to invalidate immediately
    });

    res.status(200).json({ message: 'Consent revoked successfully' });
  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ message: 'Failed to revoke consent' });
  }
};

// Create consent request (for doctors)
exports.createConsentRequest = async (req, res, next) => {
  try {
    console.log('Creating consent request ...');
    console.log(req.user);

    console.log(req.body);

    const providerId = req.user.provider.provider_id;
    const { patient_id, record_id, purpose, request_date, type } = req.body;

    // // Check if there's already a pending request
    const existingRequest = await Consent.findOne({
      where: {
        provider_id: providerId,
        patient_id: patient_id,
        health_record_id: record_id,
        // type: type,
        status: 'pending',
        // purpose: purpose
      }
    });

    const patient = await Patient.findOne({ where: { patient_id: patient_id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Update patient to indicate pending consent
    await patient.update({ has_pending_consent: true });
    console.log('Patient updated with pending consent');

    if (existingRequest) {
      return res.status(200).json({ 
        message: 'Consent request already pending for this record',
        consentId: existingRequest.consent_id
      });
    }

    const consent = await Consent.create({
      provider_id: providerId,
      patient_id: patient_id,
      health_record_id: record_id,
      type: type,
      purpose,
      request_date: new Date(),
      status: 'pending'
    });
    return res.status(201).json({
      message: 'Consent request created successfully',
      consentId: consent.consent_id
    });
  } catch (error) {
      return next(error);   
  }
};