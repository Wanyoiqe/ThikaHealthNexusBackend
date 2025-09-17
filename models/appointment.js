const { DataTypes } = require('sequelize');
// Appointments Model
const AppointmentModel = (sequelize) => {
  return sequelize.define('appointment', {
    app_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
    },
  });
};
module.exports = { AppointmentModel };