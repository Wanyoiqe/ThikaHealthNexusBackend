const fs = require('fs');
const path = require('path');
const configs = require('../config.json');
const bcrypt = require('bcryptjs');
// Import models from centralized db
const { User, Provider } = require('../db');

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
            for (const u of data.users) {
                // If password looks hashed (starts with $2), trust it; else hash it
                let password = u.password || 'password';
                if (!String(password).startsWith('$2')) {
                    password = await bcrypt.hash(String(password), 10);
                }

                // Upsert user by email
                const [usr, created] = await User.findOrCreate({
                    where: { email: u.email },
                    defaults: {
                        user_id: u.user_id,
                        first_name: u.first_name || '',
                        last_name: u.last_name || '',
                        email: u.email,
                        password,
                        phone_number: u.phone_number || null,
                        is_deleted: !!u.is_deleted,
                        role: u.role || 'patient',
                    },
                });
                if (!created) {
                    // optionally update some fields if needed
                }
            }
            console.log('Users seeded successfully.');
        }

        // Seed doctors/providers: allow `data.doctors` or infer from users with role 'doctor'
        const doctors = data.doctors || [];
        // Infer doctors from users
        const doctorUsers = await User.findAll({ where: { role: 'doctor' } });
        for (const du of doctorUsers) {
            doctors.push({
                provider_id: du.user_id,
                user_id: du.user_id,
                name: `${du.first_name} ${du.last_name}`.trim(),
                specialization: du.specialization || 'General',
                phone: du.phone_number || null,
            });
        }

        if (doctors.length > 0) {
            for (const d of doctors) {
                await Provider.findOrCreate({
                    where: { user_id: d.user_id },
                    defaults: {
                        provider_id: d.provider_id || undefined,
                        user_id: d.user_id,
                        name: d.name || 'Doctor',
                        specialization: d.specialization || 'General',
                        phone: d.phone || null,
                        is_active: d.is_active !== undefined ? !!d.is_active : true,
                        department: d.department || null,
                        hospital_id: d.hospital_id || null,
                    },
                });
            }
            console.log('Providers (doctors) seeded successfully.');
        }

        console.log('All data has been imported successfully.');

        // Write the word to the response
        return res.status(200).send(req.get("host") + " Data has been imported successfully.");
    } catch (error) {
        console.error('Unable to import data:', error);
        return next(error);
    }
};
