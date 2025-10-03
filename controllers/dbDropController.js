const { sequelize } = require('../db');

module.exports.dbDrop = async (req, res, next) => {
  try {
    await sequelize.authenticate();

    // For MySQL, disabling foreign key checks avoids constraint errors during drops
    await sequelize.query('SET foreign_key_checks = 0');

    // Drop all tables managed by Sequelize
    await sequelize.drop();

    await sequelize.query('SET foreign_key_checks = 1');

    return res.status(200).send(req.get('host') + ' All tables dropped successfully.');
  } catch (err) {
    console.error('Error dropping tables:', err);
    return next(err);
  }
};
