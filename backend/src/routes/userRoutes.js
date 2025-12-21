const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, getUsers } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/', registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);
router.route('/').get(protect, admin, getUsers);

module.exports = router;
