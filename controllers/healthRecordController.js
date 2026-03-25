const { HealthRecord, Appointment, Provider, Patient, User } = require('../models');
const { Op } = require('sequelize');

const EDIT_WINDOW_DAYS = 7;

// Create a health record. Only a provider (doctor) may create a record.
exports.createHealthRecord = async (req, res, next) => {
  try {
    const { appointment_id, record_type, data } = req.body;

    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can create health records' });

    if (!appointment_id || !record_type || !data) {
      return res.status(400).json({ result_code: 0, message: 'appointment_id, record_type, and data are required' });
    }

    const appt = await Appointment.findOne({ where: { app_id: appointment_id, provider_id: provider.provider_id } });
    if (!appt) return res.status(400).json({ result_code: 0, message: 'No matching appointment found for this provider' });

    // #3 — appointment must have already occurred
    if (new Date(appt.date_time) > new Date()) {
      return res.status(400).json({ result_code: 0, message: 'Cannot create a health record for a future appointment' });
    }

    const record = await HealthRecord.create({
      appointment_id,
      record_type,
      data,
      patient_id: appt.patient_id,
      provider_id: provider.provider_id,
    });

    // Notify the patient that a new health record was created
    try {
      const { Notification } = require('../models');
      const patientUser = await User.findOne({
        where: { user_id: (await Patient.findOne({ where: { patient_id: appt.patient_id } }))?.user_id }
      });
      if (patientUser) {
        await Notification.create({
          user_id: patientUser.user_id,
          type: 'health_record_created',
          title: 'New Health Record Added',
          message: `Dr. ${req.user.first_name} ${req.user.last_name} has added a new ${record_type.replace('_', ' ')} record to your profile.`,
          related_id: record.record_id,
          related_type: 'health_record',
        });
      }
    } catch (notifErr) {
      console.warn('Failed to create health record notification:', notifErr.message);
    }

    return res.status(201).json({ result_code: 1, message: 'Health record created', record });
  } catch (err) {
    return next(err);
  }
};

// Get records for the authenticated patient
exports.getMyRecords = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });
    if (!patient) return res.status(404).json({ result_code: 0, message: 'Patient record not found for user' });

    const health_records = await HealthRecord.findAll({
      where: { patient_id: patient.patient_id, is_active: true },
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({ result_code: 1, health_records });
  } catch (err) {
    return next(err);
  }
};

// Provider: get records for a specific patient
exports.getRecordsForPatient = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    const { patient_id } = req.params;
    if (!patient_id) return res.status(400).json({ result_code: 0, message: 'patient_id required' });

    const records = await HealthRecord.findAll({ where: { patient_id }, order: [['created_at', 'DESC']] });
    return res.status(200).json({ result_code: 1, records });
  } catch (err) {
    return next(err);
  }
};

// Get a single record by id
exports.getRecordById = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const { record_id } = req.params;
    if (!record_id) return res.status(400).json({ result_code: 0, message: 'record_id required' });

    const record = await HealthRecord.findOne({ where: { record_id } });
    if (!record) return res.status(404).json({ result_code: 0, message: 'Health record not found' });

    const patient = await Patient.findOne({ where: { patient_id: record.patient_id } });
    const provider = await Provider.findOne({ where: { provider_id: record.provider_id } });

    if (patient && patient.user_id === userId) return res.status(200).json({ result_code: 1, record });
    if (provider && provider.user_id === userId) return res.status(200).json({ result_code: 1, record });

    return res.status(403).json({ result_code: 0, message: 'Forbidden' });
  } catch (err) {
    return next(err);
  }
};

// #4 — Update health record with 7-day edit window
exports.updateHealthRecord = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const { record_id } = req.params;
    const { record_type, data } = req.body;

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can update health records' });

    const record = await HealthRecord.findOne({ where: { record_id, provider_id: provider.provider_id } });
    if (!record) return res.status(404).json({ result_code: 0, message: 'Health record not found' });

    // #4 — 7-day edit window
    const cutoff = new Date(record.created_at);
    cutoff.setDate(cutoff.getDate() + EDIT_WINDOW_DAYS);
    if (new Date() > cutoff) {
      return res.status(403).json({
        result_code: 0,
        message: `Health records can only be edited within ${EDIT_WINDOW_DAYS} days of creation`,
      });
    }

    await record.update({ record_type: record_type || record.record_type, data: data || record.data });
    return res.status(200).json({ result_code: 1, message: 'Health record updated', record });
  } catch (err) {
    return next(err);
  }
};

// Get appointments for a specific patient (provider-scoped)
exports.getAppointmentsForPatient = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    const { patient_id } = req.params;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    const appointments = await Appointment.findAll({
      where: { patient_id, provider_id: provider.provider_id },
      order: [['date_time', 'DESC']],
    });
    return res.status(200).json({ result_code: 1, appointments });
  } catch (err) {
    return next(err);
  }
};

// #5 — Get ALL health records for an appointment (was findOne, now findAll)
exports.getHealthRecordForPatientByAppointmentId = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    const { appointment_id, patient_id } = req.params;

    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    if (!appointment_id) return res.status(400).json({ result_code: 0, message: 'appointment_id required' });
    if (!patient_id) return res.status(400).json({ result_code: 0, message: 'patient_id required' });

    const appointment = await Appointment.findOne({
      where: { app_id: appointment_id, provider_id: provider.provider_id, patient_id },
    });

    if (!appointment) {
      return res.status(404).json({ result_code: 0, message: 'Appointment not found or not authorized to access' });
    }

    // Return ALL records for this appointment (not just one)
    const health_records = await HealthRecord.findAll({
      where: { appointment_id, provider_id: provider.provider_id, patient_id, is_active: true },
      attributes: ['record_id', 'record_type', 'data', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ result_code: 1, health_records });
  } catch (err) {
    return next(err);
  }
};

exports.getHealthRecordsByDoctor = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const provider = req.user.provider || await Provider.findOne({ where: { user_id: userId } });
    if (!provider) return res.status(403).json({ result_code: 0, message: 'Only providers can access other patients records' });

    const health_records = await HealthRecord.findAll({
      where: { provider_id: provider.provider_id, is_active: true },
      attributes: ['record_id', 'record_type', 'patient_id', 'appointment_id', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
    });

    const patientIds = [...new Set(health_records.map(hr => hr.patient_id))];
    const patients = await Patient.findAll({
      where: { patient_id: { [Op.in]: patientIds } },
      attributes: ['patient_id', 'name'],
    });

    return res.status(200).json({
      result_code: 1,
      health_records: health_records.map(hr => ({
        record_id: hr.record_id,
        record_type: hr.record_type,
        patient_id: hr.patient_id,
        patient_name: patients.find(p => p.patient_id === hr.patient_id)?.name || 'Unknown',
        appointment_id: hr.appointment_id,
        created_at: hr.created_at,
        updated_at: hr.updated_at,
        editable: new Date() <= (() => { const c = new Date(hr.created_at); c.setDate(c.getDate() + EDIT_WINDOW_DAYS); return c; })(),
      })),
    });
  } catch (err) {
    return next(err);
  }
};
