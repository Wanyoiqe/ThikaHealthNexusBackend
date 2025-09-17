const { Sequelize } = require("sequelize");
const configs = require("../config.json");

const args = process.argv;
// get third argument
const currentEnv = args[2];

const sequelize = new Sequelize(
  (currentEnv!=='live'?configs.database.database:configs.livedatabase.database),
  (currentEnv!=='live'?configs.database.user:configs.livedatabase.user),
  (currentEnv!=='live'?configs.database.password:configs.livedatabase.password),
  {
    host: "localhost",
    dialect: "mysql" /* 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
  }
);

module.exports.dbDrop = async (req, res, next) => {
  try {
    // Connect to the database
    await sequelize.authenticate();

    // Disable foreign key checks
    await sequelize.query('SET foreign_key_checks = 0');

    // Array of drop statements for the current backend models
    const dropStatements = [
      'DROP TABLE IF EXISTS users;',
      'DROP TABLE IF EXISTS products;'
    ];

    // Execute each drop statement individually
    for (const statement of dropStatements) {
      await sequelize.query(statement);
    }

    // Re-enable foreign key checks
    await sequelize.query('SET foreign_key_checks = 1');

    // Write the word to the response
    return res.status(200).send(req.get("host") + " All tables dropped successfully.");
  } catch (err) {
    console.error('Error dropping tables:', err);
    return next(err);
  }
};
