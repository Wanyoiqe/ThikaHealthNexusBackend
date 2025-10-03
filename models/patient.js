// Patients Model
const { DataTypes } = require('sequelize');

const PatientModel = (sequelize) => {
  return sequelize.define('patient', {
    patient_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
    },
    diagnosis: {
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.STRING(20),
    },
  });
};
module.exports = { PatientModel };
