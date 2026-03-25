const { DataTypes } = require('sequelize');

const NotificationModel = (sequelize) => {
  return sequelize.define('notification', {
    notification_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
    },
    type: {
      type: DataTypes.ENUM(
        'appointment_booked',
        'consent_approved',
        'consent_denied',
        'health_record_created'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    related_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    related_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
};

module.exports = { NotificationModel };
