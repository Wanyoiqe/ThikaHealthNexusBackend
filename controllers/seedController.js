const fs = require('fs');
const path = require('path');
const configs = require('../config.json');
const bcrypt = require('bcryptjs');
// Import models from centralized models index
const { User, Provider, Specialization, Hospital } = require('../models'); // adjust path if needed

module.exports.seedData = async (req, res, next) => {
  try {
    const jsonFilePath = path.join(__dirname, '..', 'data', 'data.json');
    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

    console.log('🚀 Starting data seeding...');

    /** =====================
     * 1️⃣ SEED HOSPITALS
     ====================== */
    if (data.hospitals && data.hospitals.length > 0) {
      for (const h of data.hospitals) {
        await Hospital.findOrCreate({
          where: { hospital_id: h.hospital_id },
          defaults: {
            hospital_id: h.hospital_id,
            name: h.name,
            location: h.location,
            phone: h.phone,
          },
        });
      }
      console.log('🏥 Hospitals seeded successfully.');
    }

    /** =====================
     * 2️⃣ SEED USERS
     ====================== */
    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        let password = u.password || 'password';
        if (!String(password).startsWith('$2')) {
          password = await bcrypt.hash(String(password), 10);
        }

        await User.findOrCreate({
          where: { email: u.email },
          defaults: {
            user_id: u.user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            password,
            phone_number: u.phone_number,
            role: u.role || 'patient',
            is_deleted: !!u.is_deleted,
          },
        });
      }
      console.log('👤 Users seeded successfully.');
    }

    /** =====================
     * 3️⃣ SEED SPECIALIZATIONS
     ====================== */
    if (data.specializations && data.specializations.length > 0) {
      for (const s of data.specializations) {
        await Specialization.findOrCreate({
          where: { specialization_id: s.specialization_id },
          defaults: {
            specialization_id: s.specialization_id,
            name: s.name,
            description: s.description,
            hospital_id: s.hospital_id,
          },
        });
      }
      console.log('🩺 Specializations seeded successfully.');
    }

    /** =====================
     * 4️⃣ SEED PROVIDERS
     ====================== */
    if (data.providers && data.providers.length > 0) {
      for (const p of data.providers) {
        await Provider.findOrCreate({
          where: { provider_id: p.provider_id },
          defaults: {
            provider_id: p.provider_id,
            user_id: p.user_id,
            name: p.name,
            specialization_id: p.specialization_id,
            hospital_id: p.hospital_id,
            is_active: !!p.is_active,
          },
        });
      }
      console.log('👨‍⚕️ Providers seeded successfully.');
    }

    console.log('✅ All data has been imported successfully.');
    return res.status(200).send('Data imported successfully.');
  } catch (error) {
    console.error('❌ Unable to import data:', error);
    return next(error);
  }
};