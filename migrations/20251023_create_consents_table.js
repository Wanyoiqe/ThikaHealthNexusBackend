const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    await sequelize.getQueryInterface().createTable('consents', {
      consent_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      patient_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'patient_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'providers',
          key: 'provider_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'denied', 'revoked'),
        defaultValue: 'pending'
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      request_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      response_date: {
        type: DataTypes.DATE
      },
      expiry_date: {
        type: DataTypes.DATE
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes for better query performance
    await sequelize.getQueryInterface().addIndex('consents', ['patient_id']);
    await sequelize.getQueryInterface().addIndex('consents', ['provider_id']);
    await sequelize.getQueryInterface().addIndex('consents', ['status']);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    await sequelize.getQueryInterface().dropTable('consents');
  } catch (error) {
    console.error('Migration rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };