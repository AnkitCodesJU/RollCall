const express = require('express');
const router = express.Router();
const { createClass, getClasses, getClassById, enrollStudent, joinClass, approveRequest, declineRequest, getMatrix, addColumn, updateCell, archiveClass, removeStudent, deleteColumn } = require('../controllers/classController');
const { protect, teacher } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, teacher, createClass)
  .get(protect, getClasses);

router.route('/join')
  .post(protect, joinClass);

router.route('/:id')
  .get(protect, getClassById);

router.route('/:id/enroll')
  .post(protect, teacher, enrollStudent);

router.route('/:id/approve')
  .put(protect, teacher, approveRequest);

router.route('/:id/decline')
  .put(protect, teacher, declineRequest);

router.route('/:id/columns')
  .post(protect, teacher, addColumn);

router.route('/:id/cells')
  .put(protect, teacher, updateCell);

router.route('/:id/matrix')
  .get(protect, getMatrix);

router.route('/:id/archive')
  .put(protect, teacher, archiveClass);

router.route('/:id/remove')
  .put(protect, teacher, removeStudent);

router.route('/:id/columns/:columnId')
  .delete(protect, teacher, deleteColumn);

module.exports = router;
