// Providers Model
const { DataTypes } = require('sequelize');
const { user } = require('../db');
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
      references: {
        model: user,
        key: 'user_id',
      },
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