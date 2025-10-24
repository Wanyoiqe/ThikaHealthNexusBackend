require('dotenv').config();
const { Sequelize } = require('sequelize');
const configs = require('../config.json');

// Model factories
const UserModel = require('./User');
const { PatientModel } = require('./patient');
const { ProviderModel } = require('./provider');
const { HospitalModel } = require('./hospital');
const { AppointmentModel } = require('./appointment');
const { AuditLogModel } = require('./auditLog');
const { HealthRecordModel } = require('./healthRecords');
const { PrescriptionModel } = require('./prescription');
const { SpecializationModel } = require('./specializations');
const { ConsentModel } = require('./consent');

const sequelize = new Sequelize(
  configs.database.database,
  configs.database.user,
  configs.database.password,
  {
    host: configs.database.host || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

// Initialize models (no associations)
const User = UserModel(sequelize);
const Patient = PatientModel(sequelize);
const Provider = ProviderModel(sequelize);
const Hospital = HospitalModel(sequelize);
const Appointment = AppointmentModel(sequelize);
const AuditLog = AuditLogModel(sequelize);
const HealthRecord = HealthRecordModel(sequelize);
const Prescription = PrescriptionModel(sequelize);
const Specialization = SpecializationModel(sequelize);
const Consent = ConsentModel(sequelize);

// Consent associations
Consent.belongsTo(Provider, { foreignKey: 'provider_id' });
Provider.hasMany(Consent, { foreignKey: 'provider_id' });
Consent.belongsTo(Patient, { foreignKey: 'patient_id' });
Patient.hasMany(Consent, { foreignKey: 'patient_id' });

Provider.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasOne(Provider, {
  foreignKey: 'user_id',
  as: 'provider',
});

module.exports = {
  sequelize,
  Sequelize,
  User,
  Patient,
  Provider,
  Hospital,
  Appointment,
  AuditLog,
  HealthRecord,
  Prescription,
  Specialization,
  Consent,
};
