const { Router } = require('express');
const router = Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/api/notifications', authenticateToken, notificationController.getNotifications);
router.patch('/api/notifications/read-all', authenticateToken, notificationController.markAllRead);
router.patch('/api/notifications/:id/read', authenticateToken, notificationController.markOneRead);

module.exports = router;
