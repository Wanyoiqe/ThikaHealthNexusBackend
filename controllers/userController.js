const { User, Patient, Provider } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOnboardingEmail } = require("../utils/onboardingEmail");
const { generateToken } = require("../middlewares/authMiddleware");

// User Registration (Sign up)
exports.registerPatient = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;

    // default role to 'patient' if not provided
    const userRole = role || 'patient';

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        result_code: 0,
        message: 'User with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let existingPatient = null;
    const newUser = await User.create({
      first_name:firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword.trim(),
      phone_number: phone.trim(),
      role: userRole.trim(), 
    });

    console.log('New user created:', newUser);

    // If onboarding a patient, create a Patient record
    if (userRole === 'patient') {
      // combine names for patient.name
      const name = `${newUser.first_name} ${newUser.last_name}`.trim();
      // avoid duplicate patient entries
      existingPatient = await Patient.findOne({ where: { user_id: newUser.user_id } });
      if (!existingPatient) {
        await Patient.create({
          user_id: newUser.user_id,
          name,
        });
      }
    }

    // Generate JWT Token
    const token = generateToken(newUser);

    // Append token to response (include role)
    const userWithToken = {
      ...newUser.toJSON(),
      token,
    };

    
    try {
      // call but don't await so login remains fast
      sendOnboardingEmail(newUser).then((ok) => {
        if (!ok) console.warn('Welcome email failed to send to', newUser.email);
        if (ok) console.log('Welcome email sent to', newUser.email);
      }).catch((e) => console.error('Error while sending welcome email:', e));
    } catch (e) {
      console.error('Unexpected error initiating welcome email:', e);
    }

    return res.status(existingUser ? 200 : 201).json({
      result_code: 1,
      message: existingUser ? 'User reactivated and registered successfully' : 'User registered successfully',
      user: userWithToken,
      patient: existingPatient,
      token,
    });
  } catch (err) {
    console.error('Error registering user:', err);
    return next(err);
  }
};

// User Login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const foundUser = await User.findOne({ where: { email } });
    if (!foundUser) {
      // Check if user is deleted
      return res.status(401).json({
        result_code: 0,
        message: "Invalid credentials.",
      });
    }
    if(foundUser.is_deleted){
      return res.status(401).json({
        result_code: 0,
        message: "Account has been deactivated. Kindly contact admin.",
      });
    }
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ result_code: 0, message: "Invalid credentials." });
    }

    if (foundUser.role === 'patient') {
      const patient = await Patient.findOne({ where: { user_id: foundUser.user_id } });
      if (!patient) {
        return res.status(500).json({ result_code: 0, message: "Patient record not found." });
      }
      foundUser.dataValues.patient = patient; // attach patient record to user
    }

    if (foundUser.role === 'doctor') {
      const provider = await Provider.findOne({ where: { user_id: foundUser.user_id } });
      if (!provider) {
        return res.status(500).json({ result_code: 0, message: "Provider record not found." });
      }
      foundUser.dataValues.provider = provider; // attach provider record to user
    }


    const token = generateToken(foundUser);
    
    // Include token in the user object
    const userWithToken = {
      ...foundUser.toJSON(),
      token,
    };

    return res.status(200).json({
      result_code: 1,
      message: "Login successful",
      user: userWithToken,
      token,
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    return next(err);
  }
};
 
//test email
exports.testEmail = async (req, res, next) => {
  try {
    const email = req.body.email;  
    if (await sendOnboardingEmail(email)) {
      return res.status(200).json({ message: "Email sent successfully" });
    } else {
      return res.status(500).json({ message: "Failed to send email" });
    }
  } catch (err) {
    console.error("Error sending test email:", err);
    return next(err);

  }
};

// Get available doctors within a time window. Expects { from, to }
// Get all doctors with complete details
exports.getAllDoctors = async (req, res, next) => {
  try {

    const providers = await Provider.findAll({
      where: { is_deleted: false, is_active: true },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'doctor', is_deleted: false, isActive: true },
          attributes: [
            'user_id',
            'first_name',
            'last_name',
            'email',
            'gender',
            'phone_number',
            'profileUrl',
          ],
        },
      ],
    });

    if (!providers.length) {
      return res.status(200).json({
        result_code: 1,
        doctors: [],
      });
    }

    // Harmonize provider + user details for frontend
    const doctors = providers.map((p) => {
      const u = p.user || {};
      return {
        provider_id: p.provider_id,
        user_id: u.user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        full_name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        gender: u.gender,
        phone_number: u.phone_number,
        profileUrl: u.profileUrl,
        specialization_id: p.specialization_id,
        hospital_id: p.hospital_id,
        is_active: p.is_active,
        is_deleted: p.is_deleted,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });


    return res.status(200).json({ result_code: 1, doctors });
  } catch (err) {
    console.error('Error in getAllDoctors:', err);
    return next(err);
  }
};