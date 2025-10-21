const bcrypt = require('bcryptjs');
const { User, Patient, Provider } = require("../models");

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
    const specializationObj = specializations.find(spec => spec.name === specialization);
    if (!specializationObj) {
      return res.status(400).json({ message: "Invalid specialization selected" });
    }
    const specialization_id = specializationObj.id;

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
