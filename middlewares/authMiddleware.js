const jwt = require('jsonwebtoken');
const configs = require('../config.json');
const { User, Patient, Provider } = require('../db'); // Assuming '../db' exports models; adjust if it's '../models'

exports.authenticateToken = async (req, res, next) => { // Make it async for DB fetches
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ result_code: 0, message: 'Authentication token required.' });
    }

    const authSecret = process.env.AUTH_SECRET || configs.authSecret || 'secretEncryptionKey';
    
    try {
        const userPayload = jwt.verify(token, authSecret);
        const foundUser = await User.findOne({ 
            where: { user_id: userPayload.user_id, is_deleted: false },
            attributes: ['user_id', 'role', 'first_name', 'last_name', 'email', 'phone_number'] // Include role & basics
        });
        
        if (!foundUser) {
            return res.status(403).json({ result_code: 0, message: 'User not found or deleted.' });
        }

        // Hydrate with role-specific associations
        const userData = foundUser.toJSON();
        if (foundUser.role === 'patient') {
            const patient = await Patient.findOne({ where: { user_id: foundUser.user_id } });
            if (!patient) {
                return res.status(500).json({ result_code: 0, message: "Patient record not found." });
            }
            userData.patient = patient.toJSON();
        } else if (foundUser.role === 'doctor') { // Assuming 'doctor' role from providerController.js
            const provider = await Provider.findOne({ where: { user_id: foundUser.user_id } });
            if (!provider) {
                return res.status(500).json({ result_code: 0, message: "Provider record not found." });
            }
            userData.provider = provider.toJSON();
        }

        // Attach full hydrated user to req
        req.user = userData;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(403).json({ result_code: 0, message: 'Invalid or expired token.' });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ result_code: 0, message: 'Authentication failed.' });
    }
};

exports.generateToken = (user) => {
    const authSecret = process.env.AUTH_SECRET || configs.authSecret || 'secretEncryptionKey';
    // Optionally include role in payload for quicker checks (avoids extra DB hit if no associations needed)
    const payload = { 
        user_id: user.user_id,
        role: user.role // Add role for fast access in some routes
    };
    return jwt.sign(payload, authSecret, { expiresIn: '24h' });
};