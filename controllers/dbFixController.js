// Use centralized models (no associations here). We still reuse the Sequelize instance
const { sequelize } = require('../models');

module.exports.dbfix = async (req, res, next) => {
  try {
    // Ensure the database connection is alive
    await sequelize.authenticate();

    // Run schema sync (alter). This mirrors the previous behavior but uses
    // the central Sequelize instance.
    await sequelize.sync({ alter: true });

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(req.get('host') + ' DB Fixed.');
  } catch (err) {
    console.log(err);
    return next(err);
  }
};