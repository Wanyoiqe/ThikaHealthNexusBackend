const { Appointment, Provider, User } = require('../models');
const { Op } = require('sequelize');

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

    return res.status(201).json({ result_code: 1, message: 'Appointment booked', appointment: appt });
  } catch (err) {
    return next(err);
  }
};

// Get available doctors within a time window. Expects { from, to }
exports.getAvailableDoctors = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ result_code: 0, message: 'from and to required' });

    // Find providers who have NO appointments in that time window
    const busyProviderIds = await Appointment.findAll({
      where: {
        date_time: {
          [Op.between]: [new Date(from), new Date(to)],
        },
      },
      attributes: ['provider_id'],
      group: ['provider_id'],
    }).then(rows => rows.map(r => r.provider_id).filter(Boolean));

    const where = { is_deleted: false };
    if (busyProviderIds.length) where.provider_id = { [Op.notIn]: busyProviderIds };

    const available = await Provider.findAll({ where });
    return res.status(200).json({ result_code: 1, available });
  } catch (err) {
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
    return res.status(200).json({ result_code: 1, appointments: appts });
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
    return res.status(200).json({ result_code: 1, appointments: appts });
  } catch (err) {
    return next(err);
  }
};
