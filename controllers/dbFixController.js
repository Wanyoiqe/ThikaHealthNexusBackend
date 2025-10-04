// Use central db initialization instead of creating a separate Sequelize
// instance here. This keeps associations and model instances consistent.
const { sequelize, User, Patient, Provider, Hospital, Appointment, AuditLog, HealthRecord, Prescription } = require('../db');

module.exports.dbfix = async (req, res, next) => {
  try {
    // Ensure the database connection is alive
    await sequelize.authenticate();

    // Run schema sync (alter). This mirrors the previous behavior but uses
    // the central Sequelize instance.
    await sequelize.sync({ alter: true });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(req.get('host') + ' DB Fixed.');
  } catch (err) {
    console.log(err);
    return next(err);
  }
};