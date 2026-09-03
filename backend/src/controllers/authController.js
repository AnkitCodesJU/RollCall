const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// Hardcoded expiry values (not in .env per project convention)
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// --- Token Generators ---

const generateAccessToken = (id) => {
  return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

// --- Utility: SHA-256 hash for secure DB storage ---

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// --- Cookie Helpers ---

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    path: '/api/auth',
  });
};

// --- DB: Store refresh token hash ---

const storeRefreshToken = async (token, userId) => {
  const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MAX_AGE);
  await RefreshToken.create({
    tokenHash: hashToken(token),
    user: userId,
    expiresAt,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, phone, password, role, studentId, employeeId } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name, email, phone, password, role, studentId, employeeId,
    });

    if (user) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      await storeRefreshToken(refreshToken, user._id);
      setRefreshCookie(res, refreshToken);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accessToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Auth user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      await storeRefreshToken(refreshToken, user._id);
      setRefreshCookie(res, refreshToken);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token (with token rotation)
// @route   POST /api/auth/refresh
// @access  Public (uses HttpOnly cookie)
const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    // Verify JWT signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure this is a refresh token, not an access token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    // Atomically find and delete the token (rotation)
    const tokenHash = hashToken(token);
    const storedToken = await RefreshToken.findOneAndDelete({ tokenHash });

    if (!storedToken) {
      // Token not in DB — either already rotated or stolen token reuse.
      // Security: revoke ALL tokens for this user to force re-login.
      await RefreshToken.deleteMany({ user: decoded.id });
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Token reuse detected, all sessions revoked' });
    }

    // Fetch user data
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'User not found' });
    }

    // Issue new token pair (rotation)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    await storeRefreshToken(newRefreshToken, user._id);
    setRefreshCookie(res, newRefreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken: newAccessToken,
    });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user (revoke refresh token)
// @route   POST /api/auth/logout
// @access  Public (uses HttpOnly cookie)
const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const tokenHash = hashToken(token);
      await RefreshToken.deleteOne({ tokenHash });
    } catch (error) {
      // Silently ignore — token might already be expired/deleted
    }
  }

  clearRefreshCookie(res);
  res.json({ message: 'Logged out successfully' });
};

module.exports = { register, login, refresh, logout };
