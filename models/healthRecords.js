const { DataTypes } = require('sequelize');

// Health Records Model
const HealthRecordModel = (sequelize) => {
  return sequelize.define('health_record', {
    record_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    record_type: {
      type: DataTypes.ENUM('lab_results', 'medication', 'vitals'),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidData(value) {
          if (!value) throw new Error('Data is required');
          
          const recordType = this.getDataValue('record_type');
          
          // Validate structure based on record_type
          switch (recordType) {
            case 'lab_results':
              if (!value.testName || !value.result) {
                throw new Error('Lab results require testName and result');
              }
              break;
            case 'medication':
              if (!value.medicationName || !value.dosage || !value.frequency || !value.duration) {
                throw new Error('Medication requires name, dosage, frequency, and duration');
              }
              break;
            case 'vitals':
              if (!value.bloodPressure || !value.heartRate || !value.temperature) {
                throw new Error('Vitals require blood pressure, heart rate, and temperature');
              }
              break;
            default:
              throw new Error('Invalid record type');
          }
        }
      }
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'patient_id'
      }
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'providers',
        key: 'provider_id'
      }
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'appointments',
        key: 'app_id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  });
};

module.exports = { HealthRecordModel };