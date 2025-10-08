// Providers Model
const { DataTypes } = require('sequelize');

// Pure factory - associations are defined centrally in db.js
const SpecializationModel = (sequelize) => {
  return sequelize.define('specializations', {
    specialization_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    hospital_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
};
module.exports = { SpecializationModel };