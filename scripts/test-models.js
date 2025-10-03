// Quick smoke test using in-memory SQLite to validate models and associations.

const { Sequelize } = require('sequelize');
const UserModel = require('../models/User');
const { PatientModel } = require('../models/patient');
const { ProviderModel } = require('../models/provider');
const { HospitalModel } = require('../models/hospital');
const { AppointmentModel } = require('../models/appointment');
const { AuditLogModel } = require('../models/auditLog');
const { HealthRecordModel } = require('../models/healthRecords');
const { PrescriptionModel } = require('../models/prescription');

(async () => {
  const sequelize = new Sequelize('sqlite::memory:', { logging: false });

  const User = UserModel(sequelize);
  const Patient = PatientModel(sequelize);
  const Provider = ProviderModel(sequelize);
  const Hospital = HospitalModel(sequelize);
  const Appointment = AppointmentModel(sequelize);
  const AuditLog = AuditLogModel(sequelize);
  const HealthRecord = HealthRecordModel(sequelize);
  const Prescription = PrescriptionModel(sequelize);

  // Associations
  User.hasOne(Patient, { foreignKey: 'user_id' });
  Patient.belongsTo(User, { foreignKey: 'user_id' });

  User.hasOne(Provider, { foreignKey: 'user_id' });
  Provider.belongsTo(User, { foreignKey: 'user_id' });

  Hospital.hasMany(Patient, { foreignKey: 'hospital_id' });
  Patient.belongsTo(Hospital, { foreignKey: 'hospital_id' });

  Hospital.hasMany(Provider, { foreignKey: 'hospital_id' });
  Provider.belongsTo(Hospital, { foreignKey: 'hospital_id' });

  Patient.hasMany(HealthRecord, { foreignKey: 'patient_id' });
  HealthRecord.belongsTo(Patient, { foreignKey: 'patient_id' });

  Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
  Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

  Provider.hasMany(Appointment, { foreignKey: 'provider_id' });
  Appointment.belongsTo(Provider, { foreignKey: 'provider_id' });

  HealthRecord.hasMany(Prescription, { foreignKey: 'record_id' });
  Prescription.belongsTo(HealthRecord, { foreignKey: 'record_id' });

  Provider.hasMany(Prescription, { foreignKey: 'provider_id' });
  Prescription.belongsTo(Provider, { foreignKey: 'provider_id' });

  User.hasMany(AuditLog, { foreignKey: 'user_id' });
  AuditLog.belongsTo(User, { foreignKey: 'user_id' });

  try {
    await sequelize.sync({ force: true });
    console.log('In-memory DB sync OK');

    // Create some sample records
    const user = await User.create({ first_name: 'Test', last_name: 'User', email: 't@example.com', password: 'x', role: 'patient' });
    const patient = await Patient.create({ user_id: user.user_id, name: 'Test Patient' });
    const hospital = await Hospital.create({ name: 'Test Hospital' });
    await patient.setHospital(hospital);

    const providerUser = await User.create({ first_name: 'Doc', last_name: 'Who', email: 'd@example.com', password: 'x', role: 'doctor' });
    const provider = await Provider.create({ user_id: providerUser.user_id, name: 'Dr Who' });

    const appt = await Appointment.create({ patient_id: patient.patient_id, provider_id: provider.provider_id, date_time: new Date() });

    const record = await HealthRecord.create({ patient_id: patient.patient_id, provider_id: provider.provider_id, diagnosis: 'OK' });
    const presc = await Prescription.create({ medication: 'Med', record_id: record.record_id, provider_id: provider.provider_id });

    console.log('Sample data created:', { user: user.user_id, patient: patient.patient_id, appt: appt.app_id, record: record.record_id, presc: presc.presc_id });

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
