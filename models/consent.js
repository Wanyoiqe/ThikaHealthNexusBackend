const { DataTypes } = require('sequelize');

const ConsentModel = (sequelize) => {
  return sequelize.define('consents', {
    consent_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'denied', 'revoked'),
      defaultValue: 'pending',
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    request_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    response_date: {
      type: DataTypes.DATE,
    },
    expiry_date: {
      type: DataTypes.DATE,
    },
  });
};

module.exports = { ConsentModel };