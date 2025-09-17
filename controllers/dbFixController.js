const { Sequelize } = require("sequelize");
const configs = require("../config.json");

const userModel = require("../models/User");
const { AppointmentModel } = require("../models/Appointment");
const { AuditLogModel } = require("../models/AuditLog");
const { HealthRecordModel } = require("../models/healthRecords");
const { HospitalModel } = require("../models/Hospital");
const { PatientModel } = require("../models/Patient");
const { PrescriptionModel } = require("../models/Prescription");
const { ProviderModel } = require("../models/Provider");

const args = process.argv;
// get third argument
const currentEnv = args[2];

module.exports.dbfix = async (req, res, next) => {
  try {
    const sequelize = new Sequelize(
      currentEnv !== "live"
        ? configs.database.database
        : configs.livedatabase.database,
      currentEnv !== "live" ? configs.database.user : configs.livedatabase.user,
      currentEnv !== "live"
        ? configs.database.password
        : configs.livedatabase.password,
      {
        host: "localhost",
        dialect: "mysql",
      }
    );

    // Initialize models
  const user = userModel(sequelize);
    const appointment = AppointmentModel(sequelize);
    const auditLog = AuditLogModel(sequelize);
    const healthRecord = HealthRecordModel(sequelize);
    const hospital = HospitalModel(sequelize);
    const patient = PatientModel(sequelize);
    const prescription = PrescriptionModel(sequelize);
    const provider = ProviderModel(sequelize);

    await sequelize.authenticate();

    // ---------------------------
    // Define Associations
    // ---------------------------

    // Users ↔ Patients / Providers
    user.hasOne(patient, { foreignKey: "user_id" });
    patient.belongsTo(user, { foreignKey: "user_id" });

    user.hasOne(provider, { foreignKey: "user_id" });
    provider.belongsTo(user, { foreignKey: "user_id" });

    // Hospitals ↔ Patients / Providers
    hospital.hasMany(patient, { foreignKey: "hospital_id" });
    patient.belongsTo(hospital, { foreignKey: "hospital_id" });

    hospital.hasMany(provider, { foreignKey: "hospital_id" });
    provider.belongsTo(hospital, { foreignKey: "hospital_id" });

    // Patients ↔ HealthRecords
    patient.hasMany(healthRecord, { foreignKey: "patient_id" });
    healthRecord.belongsTo(patient, { foreignKey: "patient_id" });

    // Appointments ↔ Patients & Providers
    patient.hasMany(appointment, { foreignKey: "patient_id" });
    appointment.belongsTo(patient, { foreignKey: "patient_id" });

    provider.hasMany(appointment, { foreignKey: "provider_id" });
    appointment.belongsTo(provider, { foreignKey: "provider_id" });

    // Prescriptions ↔ HealthRecords & Providers
    healthRecord.hasMany(prescription, { foreignKey: "record_id" });
    prescription.belongsTo(healthRecord, { foreignKey: "record_id" });

    provider.hasMany(prescription, { foreignKey: "provider_id" });
    prescription.belongsTo(provider, { foreignKey: "provider_id" });

    // Audit Log ↔ Users
    user.hasMany(auditLog, { foreignKey: "user_id" });
    auditLog.belongsTo(user, { foreignKey: "user_id" });

    // ---------------------------
    // Sync database
    // ---------------------------
    sequelize
      .sync({ alter: true })
      .then(() => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end(req.get("host") + " DB Fixed.");
      });

    module.exports = {
      user,
      appointment,
      auditLog,
      healthRecord,
      hospital,
      patient,
      prescription,
      provider,
      sequelize, // Export sequelize instance
    };
  } catch (err) {
    console.log(err);
    return next(err);
  }
};