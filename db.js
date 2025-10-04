require('dotenv').config();
const { Sequelize } = require('sequelize');
const configs = require('./config.json');

// Prefer environment variables (useful with docker-compose/.env). Fall back to config.json.
const dbEnv = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || configs.database.host || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQL_PORT || configs.database.port || 3306,
  user: process.env.DB_USER || process.env.MYSQL_USER || configs.database.user,
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || configs.database.password,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || configs.database.database,
};

// Model factories
const UserModel = require('./models/User');
const { PatientModel } = require('./models/patient');
const { ProviderModel } = require('./models/provider');
const { HospitalModel } = require('./models/hospital');
const { AppointmentModel } = require('./models/appointment');
const { AuditLogModel } = require('./models/auditLog');
const { HealthRecordModel } = require('./models/healthRecords');
const { PrescriptionModel } = require('./models/prescription');

const sequelize = new Sequelize(
  dbEnv.database,
  dbEnv.user,
  dbEnv.password,
  {
    host: dbEnv.host,
    port: dbEnv.port,
    dialect: 'mysql',
    logging: false,
  }
);

// Helpful (non-sensitive) startup log to aid debugging. Do not print password.
console.log(`DB -> host=${dbEnv.host} port=${dbEnv.port} database=${dbEnv.database} user=${dbEnv.user}`);

// Initialize models
const User = UserModel(sequelize);
const Patient = PatientModel(sequelize);
const Provider = ProviderModel(sequelize);
const Hospital = HospitalModel(sequelize);
const Appointment = AppointmentModel(sequelize);
const AuditLog = AuditLogModel(sequelize);
const HealthRecord = HealthRecordModel(sequelize);
const Prescription = PrescriptionModel(sequelize);

// Define associations centrally
// Users ↔ Patients / Providers
User.hasOne(Patient, { foreignKey: 'user_id' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Provider, { foreignKey: 'user_id' });
Provider.belongsTo(User, { foreignKey: 'user_id' });

// Hospitals ↔ Patients / Providers
Hospital.hasMany(Patient, { foreignKey: 'hospital_id' });
Patient.belongsTo(Hospital, { foreignKey: 'hospital_id' });

Hospital.hasMany(Provider, { foreignKey: 'hospital_id' });
Provider.belongsTo(Hospital, { foreignKey: 'hospital_id' });

// Patients ↔ HealthRecords
Patient.hasMany(HealthRecord, { foreignKey: 'patient_id' });
HealthRecord.belongsTo(Patient, { foreignKey: 'patient_id' });

// Appointments ↔ Patients & Providers
Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

Provider.hasMany(Appointment, { foreignKey: 'provider_id' });
Appointment.belongsTo(Provider, { foreignKey: 'provider_id' });

// Prescriptions ↔ HealthRecords & Providers
HealthRecord.hasMany(Prescription, { foreignKey: 'record_id' });
Prescription.belongsTo(HealthRecord, { foreignKey: 'record_id' });

Provider.hasMany(Prescription, { foreignKey: 'provider_id' });
Prescription.belongsTo(Provider, { foreignKey: 'provider_id' });

// Audit Log ↔ Users
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

// Export models and sequelize
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