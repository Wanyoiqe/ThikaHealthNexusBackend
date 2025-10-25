const { DataTypes } = require('sequelize');

// Health Records Model
const HealthRecordModel = (sequelize) => {
  return sequelize.define('health_record', {
    record_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
    },
    treatment: {
      type: DataTypes.TEXT,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
};

module.exports = { HealthRecordModel };