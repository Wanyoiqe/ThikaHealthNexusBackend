const fs = require('fs');
const path = require('path');
const configs = require("../config.json");
// Import all models
const { user} = require('../db');

module.exports.seedData = async (req, res, next) => {
    try {
        // Load JSON data
        const jsonFilePath = path.join(__dirname, '..', 'data/data.json'); // Path to your JSON file
        const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

        console.log('Starting data seeding...');

        // Clear existing data in a specific order to avoid foreign key constraints issues
        // Note: For a production environment, consider a more robust migration/seeding strategy.
        // For testing/development, dropping tables before seeding might be necessary if IDs conflict.
        // However, if you're relying on `db.fix` to `alter: true`, existing data might persist.
        // For a clean seed, you might want to run db.drop first, then db.fix, then seed.

        // Seed Users
        if (data.users && data.users.length > 0) {
            await user.bulkCreate(data.users, { ignoreDuplicates: true });
            console.log('Users seeded successfully.');
        }

        console.log('All data has been imported successfully.');

        // Write the word to the response
        return res.status(200).send(req.get("host") + " Data has been imported successfully.");
    } catch (error) {
        console.error('Unable to import data:', error);
        return next(error);
    }
};
