const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ 
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rollNumber: { type: String } 
  }],
  joinRequests: [{ 
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rollNumber: { type: String }
  }],
  isArchived: { type: Boolean, default: false },
  columns: [{
    name: String,
    type: { type: String, enum: ['attendance', 'marks', 'remarks'], default: 'attendance' },
    access: { type: String, enum: ['public', 'private'], default: 'public' },
    date: { type: Date, default: Date.now }
  }],
  schedule: [{
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    startTime: String,
    endTime: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('Class', ClassSchema);
