const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['attendance', 'marks', 'info'], default: 'info' }, // for color coding
  read: { type: Boolean, default: false },
  link: { type: String }, // optional link to class/resource
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
