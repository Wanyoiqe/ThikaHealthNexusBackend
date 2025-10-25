const { HealthRecord, Appointment, Provider, Patient } = require('../db');
const { Op } = require('sequelize');

// Create a health record. Only a provider (doctor) may create a record and only around the appointment time.
exports.createHealthRecord = async (req, res, next) => {
  try {
    const { patient_id, appointment_id, diagnosis, treatment, notes } = req.body;

    // Derive provider from authenticated user
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can create health records' });

    // Ensure required fields
    if (!patient_id || !appointment_id) return res.status(400).json({ result_code: 0, message: 'patient_id and appointment_id are required' });

    // Check that the appointment exists and is for this provider and patient
    const appt = await Appointment.findOne({ where: { app_id: appointment_id, provider_id: provider.provider_id, patient_id } });
    if (!appt) return res.status(400).json({ result_code: 0, message: 'No matching appointment found for this provider and patient' });

    // Enforce timing: allow record creation only if current time is within +/-30 minutes of the appointment time
    const now = new Date();
    const apptTime = new Date(appt.date_time);
    const windowMs = 30 * 60 * 1000; // 30 minutes
    if (Math.abs(now - apptTime) > windowMs) {
      return res.status(400).json({ result_code: 0, message: 'Health records can only be created around the scheduled appointment time' });
    }

    // Create the health record
    const record = await HealthRecord.create({
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      notes: notes || null,
      patient_id,
      provider_id: provider.provider_id,
    });

    return res.status(201).json({ result_code: 1, message: 'Health record created', record });
  } catch (err) {
    return next(err);
  }
};

// Get records for the authenticated patient (patient user)
exports.getMyRecords = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    // Find patient record linked to this user
    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient record not found for user' });

    const records = await HealthRecord.findAll({ where: { patient_id: patient.patient_id }, order: [['created_at', 'DESC']] });
    return res.status(200).json({ result_code: 1, records });
  } catch (err) {
    return next(err);
  }
};

// Provider: get records for a specific patient by patient_id
exports.getRecordsForPatient = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    const { patient_id } = req.params;
    if (!patient_id) return res.status(400).json({ result_code: 0, message: 'patient_id required' });

    const records = await HealthRecord.findAll({ where: { patient_id }, order: [['created_at', 'DESC']] });
    return res.status(200).json({ result_code: 1, records });
  } catch (err) {
    return next(err);
  }
};

// Get a single record by id (accessible to patient if it's their record, or provider if they are the provider)
exports.getRecordById = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const { record_id } = req.params;
    if (!record_id) return res.status(400).json({ result_code: 0, message: 'record_id required' });

    const record = await HealthRecord.findOne({ where: { record_id } });
    if (!record) return res.status(404).json({ result_code: 0, message: 'Health record not found' });

    // Check access: patient owner or provider owner
    const patient = await Patient.findOne({ where: { patient_id: record.patient_id } });
    const provider = await Provider.findOne({ where: { provider_id: record.provider_id } });

    // If user is patient owner
    if (patient && patient.user_id === userId) {
      return res.status(200).json({ result_code: 1, record });
    }

    // If user is provider owner
    if (provider && provider.user_id === userId) {
      return res.status(200).json({ result_code: 1, record });
    }

    return res.status(403).json({ result_code: 0, message: 'Forbidden' });
  } catch (err) {
    return next(err);
  }
};


// Provider: get records for a specific patient by patient_id
exports.getAppointmentsForPatient = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    const {patient_id} = req.params;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    const appointments = await Appointment.findAll({ where: { patient_id, provider_id:provider.provider_id }, order: [['date_time', 'DESC']] });

    console.log('Appointments fetched:', appointments);
    return res.status(200).json({ result_code: 1, appointments });
  } catch (err) {
    return next(err);
  }
};

exports.getHealthRecordForPatientByAppointmentId = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    const {appointment_id, patient_id} = req.params;
    // const {} = req.params;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    // const appointments = await Appointment.findAll({ where: { patient_id, provider_id:provider.provider_id }, order: [['date_time', 'DESC']] });
    if (!appointment_id) return res.status(400).json({ result_code: 0, message: 'appointment_id required' });

    console.log('Fetching health record for appointment_id:', appointment_id, 'and patient_id:', patient_id);

    const healthRecord = await HealthRecord.findOne({ where: { appointment_id, provider_id:provider.provider_id, patient_id } });

    console.log('Appointments fetched:', healthRecord);
    return res.status(200).json({ result_code: 1, healthRecord });
  } catch (err) {
    return next(err);
  }
};
