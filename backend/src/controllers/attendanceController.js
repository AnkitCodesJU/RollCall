const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Teacher
const markAttendance = async (req, res) => {
  const { classId, date, records } = req.body;
  // records: [{ student: studentId, status: 'Present' }]

  const classItem = await Class.findById(classId);
  if (!classItem) {
    return res.status(404).json({ message: 'Class not found' });
  }

  // Check if attendance already marked for this date
  // Note: Date comparison can be tricky. Assuming date is passed as ISO string YYYY-MM-DD
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAttendance = await Attendance.findOne({
    class: classId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existingAttendance) {
    // Update existing
    existingAttendance.records = records;
    existingAttendance.markedBy = req.user._id;
    const updatedAttendance = await existingAttendance.save();
    return res.json(updatedAttendance);
  }

  const attendance = await Attendance.create({
    class: classId,
    date,
    records,
    markedBy: req.user._id
  });

  res.status(201).json(attendance);
};

// @desc    Get attendance for a class
// @route   GET /api/attendance/:classId
// @access  Private
const getAttendance = async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;

  let query = { class: classId };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const attendance = await Attendance.find(query)
    .populate('records.student', 'name email studentId')
    .populate('markedBy', 'name');

  res.json(attendance);
};

module.exports = { markAttendance, getAttendance };
