const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');
const cloudWatch = require('../utils/cloudWatch');

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, phone, role, is_verified, created_at',
      [email, passwordHash, firstName, lastName, phone, role || 'customer']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

    await cloudWatch.trackUserActivity(user.id, 'register');

    logger.info('User registered:', { userId: user.id, email: user.email });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, phone, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);

    delete user.password_hash;

    await cloudWatch.trackUserActivity(user.id, 'login');

    logger.info('User logged in:', { userId: user.id, email: user.email });

    res.json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, email, first_name, last_name, phone, role, avatar_url, is_verified, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    res.json({
      user: result.rows[0],
      addresses: addresses.rows,
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, avatarUrl } = req.body;

    const result = await db.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, first_name, last_name, phone, role, avatar_url, is_verified',
      [firstName, lastName, phone, avatarUrl, userId]
    );

    await cloudWatch.trackUserActivity(userId, 'update_profile');

    logger.info('Profile updated:', { userId });

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newPasswordHash, userId]);

    await cloudWatch.trackUserActivity(userId, 'change_password');

    logger.info('Password changed:', { userId });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
