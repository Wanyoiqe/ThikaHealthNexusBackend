module.exports = (sequelize, DataTypes) => {

  const TwoFactorAuth = sequelize.define("TwoFactorAuth", {
    user_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
    },
    email: DataTypes.STRING,
    otp_code: DataTypes.STRING,
    otp_expires_at: DataTypes.DATE,
    is_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    backup_codes: DataTypes.JSON,
  }, {
    tableName: 'two_factor_auth',
    timestamps: false, // Since your table might not have createdAt/updatedAt
  });

  return TwoFactorAuth;
};