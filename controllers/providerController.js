const bcrypt = require('bcryptjs');
const { Op } = require("sequelize");
const { User, Patient, Provider, Appointment, Specialization } = require("../models");

const specializations = [
  { id: '1', name: 'cardiology' },
  { id: '2', name: 'dermatology' },
  { id: '3', name: 'neurology' },
  { id: '4', name: 'pediatrics' },
  { id: '5', name: 'psychiatry' },
  { id: '6', name: 'radiology' },
  { id: '7', name: 'oncology' },
  { id: '8', name: 'gynecology' },
  { id: '9', name: 'orthopedics' },
  { id: '10', name: 'general_medicine' },
];

// Add a new doctor
exports.addDoctor = async (req, res) => {
  try {
    console.log('📥 Request has reached addDoctor controller');
    const { firstName, lastName, email, phone, password, gender, specialization } = req.body;

    // Validate required fields properly
    if (!firstName || !lastName || !password || !specialization || !email || !phone) {
      return res.status(400).json({
        message: "First name, last name, email, phone number, password, and specialization are required",
      });
    }

    // Match specialization name to its ID
        // Try to find the specialization in the DB (specializations table uses UUID primary keys)
        let specializationRecord = await Specialization.findOne({ where: { name: specialization } });
        // If it doesn't exist, create it so the provider can reference a valid specialization_id
        if (!specializationRecord) {
          specializationRecord = await Specialization.create({ name: specialization });
        }
        const specialization_id = specializationRecord.specialization_id;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "A user with that email already exists" });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // // Create doctor user account
    // const firstName = name.split(' ')[0];
    // const lastName = name.split(' ').slice(1).join(' ') || '';

    const user = await User.create({
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      role: 'doctor', // important for role-based login
      password: hashedPassword,
    });

    const name = `${firstName} ${lastName}`.trim();

    // Create corresponding Provider entry
    const provider = await Provider.create({
      user_id: user.user_id, // ensure FK matches your DB model
      name,
      specialization_id,
    });

    console.log("✅ Doctor created:", user.email);

    return res.status(201).json({
      result_code: 1,
      message: "Doctor added successfully",
      user,
      provider,
    });

  } catch (error) {
    console.error("❌ Error adding doctor:", error);
    res.status(500).json({ message: "Failed to add doctor" });
  }
};

// Export specializations list
exports.specializations = specializations;

// ✅ (Optional) Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const providers = await Provider.findAll({
      where: { is_deleted: false },
    });
    res.status(200).json({ doctors: providers });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Failed to get doctors" });
  }
};

exports.getDoctorsPatients = async (req, res, next) => {
  try {
    console.log('Fetching all doctors patients ...');
    const providerId = req.user.provider.provider_id;
    const doctorUserId = req.user && req.user.user_id;
    if (!doctorUserId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    let provider, appointments, patients;
    if(providerId){
      provider = await Provider.findOne({
        where: { provider_id: providerId, is_deleted: false, is_active: true },
      });
      appointments = await Appointment.findAll({
        where: { provider_id: provider.provider_id },
        order: [['date_time', 'DESC']],
      });
    } else {
      provider = await Provider.findOne({
        where: { user_id: doctorUserId, is_deleted: false, is_active: true },
      });
      appointments = await Appointment.findAll({
        where: { provider_id: provider.provider_id },
        order: [['date_time', 'DESC']],
      });
    }

    if (!appointments.length) {
      return res.status(200).json({
        result_code: 1,
        patients: [],
      });
    }

    // console.log('Appointments fetched:', appointments);

    const patientIds = [...new Set(appointments.map(app => app.patient_id))];
    console.log('Unique patient IDs:', patientIds);

    const PatientId = patientIds[0];
    console.log('Sample Patient ID:', PatientId);

    const patient = await Patient.findOne({
      where: { patient_id: PatientId },
    });
    console.log('Sample Patient fetched:', patient);

    const allPatients = await Patient.findAll({
      where: {
        patient_id: { [Op.in]: patientIds },
        is_deleted: false,
      },
    });

    patients = allPatients.map((p) => {
      return {
        patient_id: p.patient_id,
        first_name: p.name.split(' ')[0],
        last_name: p.name.split(' ').slice(1).join(' ') || '',
        full_name: p.name,
        totalVisits: appointments.filter(app => app.patient_id === p.patient_id).length,
        lastVisit: appointments
          .filter(app => app.patient_id === p.patient_id)
          .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))[0].date_time
      };
    });

    console.log('Patients fetched:', patients.length);

    if (!patients.length) {
      return res.status(200).json({
        result_code: 1,
        patients: [],
      });
    }
    
    return res.status(200).json({ result_code: 1, patients });
  } catch (err) {
    console.error('Error in getAllDoctors:', err);
    return next(err);
  }
};


exports.getReceptionistDashboardDetails = async (req, res, next) => {
  try {
    const patientCount = await Patient.count({
      where: { is_deleted: false },
    });

    const staffCount = await Provider.count({
      where: { is_deleted: false, is_active: true },
    });
    const appointmentCount = await Appointment.count({
      where: { status: { [Op.ne]: 'cancelled' } },
    });

    const appointmentCountToday = await Appointment.count({
      where: {
        status: { [Op.ne]: 'cancelled' },
        date_time: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const data = {
      patientCount,
      staffCount,
      appointmentCount,
      appointmentCountToday,
    };
    return res.status(200).json({ result_code: 1, data });
  } catch (err) {
    console.error('Error in getAllDoctors:', err);
    return next(err);
  }
};