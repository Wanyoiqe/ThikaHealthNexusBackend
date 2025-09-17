const { DataTypes } = require('sequelize');
// Prescriptions Model
const PrescriptionModel = (sequelize) => {
  return sequelize.define('prescription', {
    presc_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    medication: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dosage: {
      type: DataTypes.STRING(50),
    },
    duration: {
      type: DataTypes.STRING(50),
    },
  });
};
module.exports = { PrescriptionModel };