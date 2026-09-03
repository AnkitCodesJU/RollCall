const express = require('express');
const router = express.Router();
const { getUserProfile, getUsers } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/profile').get(protect, getUserProfile);
router.route('/').get(protect, admin, getUsers);

module.exports = router;
