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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    specialization_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'specializations', // table name to reference
        key: 'specialization_id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
module.exports = { ProviderModel };