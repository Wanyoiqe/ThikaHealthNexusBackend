'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns first
    await queryInterface.addColumn('health_records', 'record_type', {
      type: Sequelize.ENUM('lab_results', 'medication', 'vitals'),
      allowNull: true, // temporarily allow null for migration
    });

    await queryInterface.addColumn('health_records', 'data', {
      type: Sequelize.JSON,
      allowNull: true, // temporarily allow null for migration
    });

    await queryInterface.addColumn('health_records', 'is_active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('health_records', 'updated_at', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    // Add foreign key constraints if they don't exist
    await queryInterface.addConstraint('health_records', {
      fields: ['patient_id'],
      type: 'foreign key',
      name: 'fk_health_records_patient',
      references: {
        table: 'patients',
        field: 'patient_id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('health_records', {
      fields: ['provider_id'],
      type: 'foreign key',
      name: 'fk_health_records_provider',
      references: {
        table: 'providers',
        field: 'provider_id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('health_records', {
      fields: ['appointment_id'],
      type: 'foreign key',
      name: 'fk_health_records_appointment',
      references: {
        table: 'appointments',
        field: 'app_id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    // Remove old columns
    await queryInterface.removeColumn('health_records', 'diagnosis');
    await queryInterface.removeColumn('health_records', 'treatment');
    await queryInterface.removeColumn('health_records', 'notes');

    // Make the new columns required
    await queryInterface.changeColumn('health_records', 'record_type', {
      type: Sequelize.ENUM('lab_results', 'medication', 'vitals'),
      allowNull: false,
    });

    await queryInterface.changeColumn('health_records', 'data', {
      type: Sequelize.JSON,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraints
    await queryInterface.removeConstraint('health_records', 'fk_health_records_patient');
    await queryInterface.removeConstraint('health_records', 'fk_health_records_provider');
    await queryInterface.removeConstraint('health_records', 'fk_health_records_appointment');

    // Remove new columns
    await queryInterface.removeColumn('health_records', 'record_type');
    await queryInterface.removeColumn('health_records', 'data');
    await queryInterface.removeColumn('health_records', 'is_active');
    await queryInterface.removeColumn('health_records', 'updated_at');

    // Add back old columns
    await queryInterface.addColumn('health_records', 'diagnosis', {
      type: Sequelize.TEXT,
    });

    await queryInterface.addColumn('health_records', 'treatment', {
      type: Sequelize.TEXT,
    });

    await queryInterface.addColumn('health_records', 'notes', {
      type: Sequelize.TEXT,
    });
  }
};