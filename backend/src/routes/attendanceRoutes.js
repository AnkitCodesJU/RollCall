const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance } = require('../controllers/attendanceController');
const { protect, teacher } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, teacher, markAttendance);

router.route('/:classId')
  .get(protect, getAttendance);

module.exports = router;
