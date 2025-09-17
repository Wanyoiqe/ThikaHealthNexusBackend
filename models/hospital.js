const { DataTypes } = require('sequelize');
// Hospitals Model

const HospitalModel = (sequelize) => {
  return sequelize.define('hospital', {
    hospital_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    location: {
      type: DataTypes.STRING(200),
    },
  });
};
module.exports = { HospitalModel };