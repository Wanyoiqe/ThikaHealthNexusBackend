const fs = require('fs');
const path = require('path');
const configs = require('../config.json');
const bcrypt = require('bcryptjs');
// Import models from centralized db
const { User, Provider, Hospital } = require('../db');

module.exports.seedData = async (req, res, next) => {
    try {
        // Load JSON data
        const jsonFilePath = path.join(__dirname, '..', 'data/data.json'); // Path to your JSON file
        const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

        console.log('Starting data seeding...');

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
    const doctors = data.doctors ? [...data.doctors] : [];
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
            // Ensure referenced hospitals exist to avoid FK constraint errors
            const hospitalIds = new Set();
            for (const d of doctors) {
                if (d.hospital_id) hospitalIds.add(d.hospital_id);
            }

            for (const hid of hospitalIds) {
                // Create a minimal hospital record if it does not exist
                await Hospital.findOrCreate({
                    where: { hospital_id: hid },
                    defaults: {
                        hospital_id: hid,
                        name: `Imported Hospital ${hid}`,
                        phone: null,
                        location: null,
                    },
                });
                console.log(`Ensured hospital ${hid} exists`);
            }

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
