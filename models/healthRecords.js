const { DataTypes } = require('sequelize');
const { patient, provider } = require('../controllers/dbFixController');
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
      references: {
        model: patient,
        key: 'patient_id',
      },
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: provider,
        key: 'provider_id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
};


module.exports = { HealthRecordModel };