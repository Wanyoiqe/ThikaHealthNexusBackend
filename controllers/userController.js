const { user } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// User Registration (Sign up)
exports.registerUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone_number } = req.body;

    // Check if user already exists
    const existingUser = await user.findOne({ where: { email } });

    if (existingUser && !existingUser.is_deleted) {
      return res.status(409).json({
        result_code: 0,
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;

    if (existingUser && existingUser.is_deleted) {
      // Reactivate soft-deleted user
      await existingUser.update({
        first_name,
        last_name,
        phone_number,
        password: hashedPassword,
        is_deleted: false,
      });
      newUser = existingUser;
    } else {
      // Create new user
      newUser = await user.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        phone_number,
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { user_id: newUser.user_id },
      process.env.AUTH_SECRET || "secretEncryptionKey",
      { expiresIn: "1h" }
    );

    // Append token to response
    const userWithToken = {
      ...newUser.toJSON(),
      token,
    };

    res.status(existingUser ? 200 : 201).json({
      result_code: 1,
      message: existingUser
        ? "User reactivated and registered successfully"
        : "User registered successfully",
      user: userWithToken,
    });

  } catch (err) {
    console.error("Error registering user:", err);
    return next(err);
  }
};

// User Login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const foundUser = await user.findOne({ where: { email } });
    if (!foundUser || foundUser.is_deleted) {
      // Check if user is deleted
      return res
        .status(401)
        .json({
          result_code: 0,
          message: "Invalid credentials or user deleted.",
        });
    }
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ result_code: 0, message: "Invalid credentials." });
    }
    const token = jwt.sign(
      { user_id: foundUser.user_id },
      process.env.AUTH_SECRET || "secretEncryptionKey",
      { expiresIn: "1h" }
    );
    // Include token in the user object
    const userWithToken = {
      ...foundUser.toJSON(),
      token,
    };

    res
      .status(200)
      .json({
        result_code: 1,
        message: "Login successful",
        user: userWithToken,
      });
  } catch (err) {
    console.error("Error logging in user:", err);
    return next(err);
  }
};
