const { DataTypes } = require('sequelize');

// Audit Log Model
const AuditLogModel = (sequelize) => {
  return sequelize.define('audit_log', {
    log_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
};
module.exports = { AuditLogModel };
