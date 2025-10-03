const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ result_code: 0, message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.AUTH_SECRET || 'secretEncryptionKey', async (err, userPayload) => {
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