const { Appointment, Provider, User, Patient } = require('../models');
const { Op } = require('sequelize');

// Helper: shape patient for frontend
const shapePatient = async (patient_id) => {
  if (!patient_id) return null;
  const patient = await Patient.findOne({ where: { patient_id } });
  if (!patient) return null;
  const user = await User.findOne({ where: { user_id: patient.user_id }, attributes: ['phone_number'] });
  const nameParts = (patient.name || '').split(' ').filter(Boolean);
  return {
    patient_id: patient.patient_id,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    full_name: patient.name,
    phone: user?.phone_number || null,
  };
};

// Helper: shape provider for frontend
const shapeProvider = (p) => {
  if (!p) return null;
  const name = p.name || '';
  const parts = name.split(' ').filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ') || '';
  return {
    provider_id: p.provider_id,
    firstName,
    lastName,
    specialization: p.specialization,
    phone: p.phone,
    is_active: p.is_active,
    user_id: p.user_id,
    profileUrl: p.profileUrl || null,
    hospital_id: p.hospital_id,
    is_deleted: p.is_deleted,
    department: p.department,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
};

// Book appointment - patient books for themselves. req.user set by auth middleware.
exports.bookAppointment = async (req, res, next) => {
  try {
    const { date_time, provider_id } = req.body;
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });

    // Create appointment
    const appt = await Appointment.create({
      date_time,
      patient_id: patient.patient_id,
      provider_id: provider_id || null,
    });

    // Attach provider details if provider_id provided
    let provider = null;
    if (provider_id) {
      const p = await Provider.findOne({ where: { provider_id } });
      provider = shapeProvider(p);
    }

    const appointmentResponse = Object.assign({}, appt.toJSON(), { provider });

    return res.status(201).json({ result_code: 1, message: 'Appointment booked', appointment: appointmentResponse });
  } catch (err) {
    return next(err);
  }
};

// Get available doctors within a time window. Expects { from, to }
exports.getAvailableDoctors = async (req, res, next) => {
  try {
    console.log('Finding available doctors with body:', req.body);
    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).json({
        result_code: 0,
        message: 'from and to required',
      });
    }

    // Find providers who already have appointments in that time window
    const busyProviderIds = await Appointment.findAll({
      where: {
        date_time: {
          [Op.between]: [new Date(from), new Date(to)],
        },
      },
      attributes: ['provider_id'],
      group: ['provider_id'],
    }).then((rows) => rows.map((r) => r.provider_id).filter(Boolean));

    const where = { is_deleted: false };
    if (busyProviderIds.length) {
      where.provider_id = { [Op.notIn]: busyProviderIds };
    }

    // Fetch all providers that are not busy
    const providers = await Provider.findAll({ where });
    if (!providers.length) {
      return res.status(200).json({
        result_code: 1,
        available: [],
      });
    }

    // Get all related users for these providers
    const userIds = providers.map((p) => p.user_id);
    const users = await User.findAll({
      where: {
        user_id: userIds,
        role: 'doctor', // Only doctors
      },
    });

    const doctorUserIds = users.map((u) => u.user_id);

    // Filter providers who belong to users with role 'doctor'
    const doctorProviders = providers.filter((p) =>
      doctorUserIds.includes(p.user_id)
    );

    console.log('Available doctors found:', doctorProviders.length);

    // Harmonize provider shape for frontend
    const available = doctorProviders.map((p) => {
      const name = p.name || '';
      const parts = name.split(' ').filter(Boolean);
      const firstName = parts.shift() || '';
      const lastName = parts.join(' ') || '';

      // Mocked available times (for frontend)
      const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00'];

      return {
        provider_id: p.provider_id,
        firstName,
        lastName,
        specialization: p.specialization,
        phone: p.phone,
        is_active: p.is_active,
        user_id: p.user_id,
        profileUrl: p.profileUrl || null,
        hospital_id: p.hospital_id,
        is_deleted: p.is_deleted,
        department: p.department,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        availableTimes,
      };
    });

    return res.status(200).json({ result_code: 1, available });
  } catch (err) {
    console.error('Error in getAvailableDoctors:', err);
    return next(err);
  }
};

// Get upcoming appointments for the authenticated user (future)
exports.getUpcoming = async (req, res, next) => {
  try {
    // const providerId = req.user.provider.provider_id;
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });

    // Create appointment
    // const appt = await Appointment.create({
    //   date_time,
    //   patient_id: patient.patient_id,
    //   provider_id: provider_id || null,
    // });

    const now = new Date();
    const appts = await Appointment.findAll({ where: { patient_id: patient.patient_id, date_time: { [Op.gt]: now } }, order: [['date_time', 'ASC']] });

    // Batch fetch provider details to avoid N+1 queries
    const providerIds = Array.from(new Set(appts.map(a => a.provider_id).filter(Boolean)));
    let providerMap = {};
    if (providerIds.length) {
      const providers = await Provider.findAll({ where: { provider_id: providerIds } });
      providerMap = providers.reduce((acc, p) => {
        acc[p.provider_id] = shapeProvider(p);
        return acc;
      }, {});
    }

    const enriched = appts.map((a) => {
      const json = a.toJSON();
      json.provider = json.provider_id ? providerMap[json.provider_id] || null : null;
      return json;
    });

    return res.status(200).json({ result_code: 1, appointments: enriched });
  } catch (err) {
    return next(err);
  }
};

// Get all appointments for authenticated user
// Get All appointments for the authenticated user (future)
exports.getAllAppointments = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });

    const now = new Date();
    const appts = await Appointment.findAll({ where: { patient_id: patient.patient_id }, order: [['date_time', 'ASC']] });

    // Batch fetch provider details to avoid N+1 queries
    const providerIds = Array.from(new Set(appts.map(a => a.provider_id).filter(Boolean)));
    let providerMap = {};
    if (providerIds.length) {
      const providers = await Provider.findAll({ where: { provider_id: providerIds } });
      providerMap = providers.reduce((acc, p) => {
        acc[p.provider_id] = shapeProvider(p);
        return acc;
      }, {});
    }

    const enriched = appts.map((a) => {
      const json = a.toJSON();
      json.provider = json.provider_id ? providerMap[json.provider_id] || null : null;
      return json;
    });

    return res.status(200).json({ result_code: 1, appointments: enriched });
  } catch (err) {
    return next(err);
  }
};

// Get past appointments for authenticated user
exports.getPast = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const patient = await Patient.findOne({ where: { user_id: userId } });

    const now = new Date();
    const appts = await Appointment.findAll({ where: { patient_id: patient.patient_id, date_time: { [Op.lt]: now } }, order: [['date_time', 'DESC']] });

    // Batch fetch provider details to avoid N+1 queries
    const providerIdsPast = Array.from(new Set(appts.map(a => a.provider_id).filter(Boolean)));
    let providerMapPast = {};
    if (providerIdsPast.length) {
      const providers = await Provider.findAll({ where: { provider_id: providerIdsPast } });
      providerMapPast = providers.reduce((acc, p) => {
        acc[p.provider_id] = shapeProvider(p);
        return acc;
      }, {});
    }

    const enrichedPast = appts.map((a) => {
      const json = a.toJSON();
      json.provider = json.provider_id ? providerMapPast[json.provider_id] || null : null;
      return json;
    });

    return res.status(200).json({ result_code: 1, appointments: enrichedPast });
  } catch (err) {
    return next(err);
  }
};

// ─── Doctor-scoped appointment endpoints ────────────────────────────────────

const getDoctorAppointments = async (req, whereExtra) => {
  const provider = req.user?.provider;
  if (!provider) throw Object.assign(new Error('Provider record not found'), { status: 403 });

  const appts = await Appointment.findAll({
    where: { provider_id: provider.provider_id, ...whereExtra },
    order: [['date_time', 'ASC']],
  });

  // Batch fetch patient details to avoid N+1
  const patientIds = [...new Set(appts.map(a => a.patient_id).filter(Boolean))];
  const patientMap = {};
  if (patientIds.length) {
    const patients = await Patient.findAll({ where: { patient_id: patientIds } });
    const userIds = patients.map(p => p.user_id);
    const users = await User.findAll({ where: { user_id: userIds }, attributes: ['user_id', 'phone_number'] });
    const userPhoneMap = users.reduce((acc, u) => { acc[u.user_id] = u.phone_number; return acc; }, {});

    patients.forEach(p => {
      const nameParts = (p.name || '').split(' ').filter(Boolean);
      patientMap[p.patient_id] = {
        patient_id: p.patient_id,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        full_name: p.name,
        phone: userPhoneMap[p.user_id] || null,
      };
    });
  }

  return appts.map(a => {
    const json = a.toJSON();
    json.patient = json.patient_id ? patientMap[json.patient_id] || null : null;
    return json;
  });
};

// GET /api/appointments/doctor/all
exports.getDoctorAll = async (req, res, next) => {
  try {
    const appointments = await getDoctorAppointments(req, {});
    return res.status(200).json({ result_code: 1, appointments });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ result_code: 0, message: err.message });
    return next(err);
  }
};

// GET /api/appointments/doctor/upcoming
exports.getDoctorUpcoming = async (req, res, next) => {
  try {
    const appointments = await getDoctorAppointments(req, { date_time: { [Op.gt]: new Date() } });
    return res.status(200).json({ result_code: 1, appointments });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ result_code: 0, message: err.message });
    return next(err);
  }
};

// GET /api/appointments/doctor/past
exports.getDoctorPast = async (req, res, next) => {
  try {
    const appointments = await getDoctorAppointments(req, { date_time: { [Op.lte]: new Date() } });
    return res.status(200).json({ result_code: 1, appointments });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ result_code: 0, message: err.message });
    return next(err);
  }
};

// PATCH /api/appointments/:app_id/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { app_id } = req.params;
    const { status } = req.body;
    const provider = req.user?.provider;

    const validStatuses = ['completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ result_code: 0, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const appt = await Appointment.findOne({ where: { app_id } });
    if (!appt) return res.status(404).json({ result_code: 0, message: 'Appointment not found' });

    if (provider && appt.provider_id !== provider.provider_id) {
      return res.status(403).json({ result_code: 0, message: 'Not authorized to update this appointment' });
    }

    await appt.update({ status });
    return res.status(200).json({ result_code: 1, message: 'Appointment status updated', appointment: appt });
  } catch (err) {
    return next(err);
  }
};
