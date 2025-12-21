// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) return res.status(404).json({ message: 'Not found' });
  if (notification.user.toString() !== req.user._id.toString()) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  notification.read = true;
  await notification.save();
  res.json(notification);
};

module.exports = { getNotifications, markAsRead };
