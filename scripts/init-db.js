// scripts/init-db.js
// Run: node scripts/init-db.js
// This script will call sequelize.sync({ alter: true }) on the centralized
// sequelize instance. It's guarded by the environment variable INIT_DB=TRUE to
// avoid accidental runs in production.

require('dotenv').config();
const { sequelize } = require('../db');

(async () => {
  try {
    if (process.env.INIT_DB !== 'TRUE') {
      console.log('INIT_DB is not TRUE — aborting. Set INIT_DB=TRUE to run this script');
      process.exit(0);
    }

    await sequelize.authenticate();
    console.log('Database connection OK — running sync({ alter: true })');

    await sequelize.sync({ alter: true });
    console.log('Sync complete');
    process.exit(0);
  } catch (err) {
    console.error('Error initializing DB:', err);
    process.exit(1);
  }
})();
