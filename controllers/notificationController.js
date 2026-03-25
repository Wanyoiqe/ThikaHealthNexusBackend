const { Notification } = require('../models');

// GET /api/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });

    const unread_count = notifications.filter(n => !n.is_read).length;
    return res.status(200).json({ result_code: 1, notifications, unread_count });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
    return res.status(200).json({ result_code: 1, message: 'All notifications marked as read' });
  } catch (err) {
    return next(err);
  }
};

// PATCH /api/notifications/:id/read
exports.markOneRead = async (req, res, next) => {
  try {
    const userId = req.user && req.user.user_id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ result_code: 0, message: 'Unauthorized' });

    const notif = await Notification.findOne({ where: { notification_id: id, user_id: userId } });
    if (!notif) return res.status(404).json({ result_code: 0, message: 'Notification not found' });

    await notif.update({ is_read: true });
    return res.status(200).json({ result_code: 1, message: 'Notification marked as read' });
  } catch (err) {
    return next(err);
  }
};
