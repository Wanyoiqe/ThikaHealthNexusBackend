const jwt = require('jsonwebtoken');
const configs = require('../config.json');
const { User } = require('../db');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ result_code: 0, message: 'Authentication token required.' });
    }

    const authSecret = process.env.AUTH_SECRET || configs.authSecret || 'secretEncryptionKey';
    jwt.verify(token, authSecret, async (err, userPayload) => {
        if (err) {
            return res.status(403).json({ result_code: 0, message: 'Invalid or expired token.' });
        }
        const foundUser = await User.findOne({ where: { user_id: userPayload.user_id, is_deleted: false } });
        if (!foundUser) {
            return res.status(403).json({ result_code: 0, message: 'User not found or deleted.' });
        }
        req.user = { id: foundUser.user_id };
        next();
    });
};

exports.generateToken = (user) => {
    const authSecret = process.env.AUTH_SECRET || configs.authSecret || 'secretEncryptionKey';
    return jwt.sign(
        { user_id: user.user_id },
        authSecret,
        { expiresIn: '24h' }
    );
}