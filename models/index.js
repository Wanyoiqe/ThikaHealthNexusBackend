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
};
