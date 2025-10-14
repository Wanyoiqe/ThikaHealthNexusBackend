const { Appointment, Provider, User } = require('../models');
const { Op } = require('sequelize');

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
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    // Create appointment
    const appt = await Appointment.create({
      date_time,
      patient_id: req.user.id,
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
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const now = new Date();
    const appts = await Appointment.findAll({ where: { patient_id: userId, date_time: { [Op.gt]: now } }, order: [['date_time', 'ASC']] });

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
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const now = new Date();
    const appts = await Appointment.findAll({ where: { patient_id: userId }, order: [['date_time', 'ASC']] });

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
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const now = new Date();
    const appts = await Appointment.findAll({ where: { patient_id: userId, date_time: { [Op.lt]: now } }, order: [['date_time', 'DESC']] });

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
