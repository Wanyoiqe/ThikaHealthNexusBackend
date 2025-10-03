// Providers Model
const { DataTypes } = require('sequelize');

// Pure factory - associations are defined centrally in db.js
const ProviderModel = (sequelize) => {
  return sequelize.define('provider', {
    provider_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING(100),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    profileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hospital_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    department: {
      type: DataTypes.STRING(100),
    },
  });
};
module.exports = { ProviderModel };