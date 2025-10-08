const { User, Patient } = require("../models");
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

    res.status(existingUser ? 200 : 201).json({
      result_code: 1,
      message: existingUser ? 'User reactivated and registered successfully' : 'User registered successfully',
      user: userWithToken,
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