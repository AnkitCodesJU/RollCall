const mongoose = require('mongoose');

const ClassRecordSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  columnId: { type: mongoose.Schema.Types.ObjectId, required: true }, // References the sub-document _id in Class.columns
  value: { type: mongoose.Schema.Types.Mixed }, // Can be 'P'/'A'/'L', number, or text
}, { timestamps: true });

// Composite index to ensure one record per student per column
ClassRecordSchema.index({ classId: 1, studentId: 1, columnId: 1 }, { unique: true });

module.exports = mongoose.model('ClassRecord', ClassRecordSchema);
