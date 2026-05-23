import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import env from '../config/env.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').trim().notEmpty(),
  body('organization_name').trim().notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', error_code: 'VALIDATION_ERROR', details: errors.array() });

    const { email, password, full_name, organization_name, industry } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ status: 'error', error_code: 'USER_EXISTS', message: 'A user with this email already exists.' });

    const org = await Organization.create({ name: organization_name, industry: industry || 'Technology' });
    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password_hash, full_name, organization_id: org._id, role: 'admin' });

    const accessToken = jwt.sign({ userId: user._id, orgId: org._id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
    user.refresh_token = refreshToken;
    await user.save();

    res.status(201).json({
      status: 'success',
      data: {
        user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
        organization: { id: org._id, name: org.name },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) { next(error); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', error_code: 'VALIDATION_ERROR', details: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ status: 'error', error_code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ status: 'error', error_code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });

    if (!user.is_active) return res.status(403).json({ status: 'error', error_code: 'ACCOUNT_DISABLED', message: 'Account has been disabled.' });

    const accessToken = jwt.sign({ userId: user._id, orgId: user.organization_id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
    user.refresh_token = refreshToken;
    user.last_login = new Date();
    await user.save();

    const org = await Organization.findById(user.organization_id);

    res.json({
      status: 'success',
      data: {
        user: { id: user._id, email: user.email, full_name: user.full_name, role: user.role },
        organization: org ? { id: org._id, name: org.name } : null,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) { next(error); }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ status: 'error', message: 'Refresh token required.' });

    const decoded = jwt.verify(refresh_token, env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refresh_token !== refresh_token) {
      return res.status(401).json({ status: 'error', message: 'Invalid refresh token.' });
    }

    const accessToken = jwt.sign({ userId: user._id, orgId: user.organization_id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ userId: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
    user.refresh_token = newRefreshToken;
    await user.save();

    res.json({ status: 'success', data: { access_token: accessToken, refresh_token: newRefreshToken } });
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  req.user.refresh_token = null;
  await req.user.save();
  res.json({ status: 'success', message: 'Logged out successfully.' });
});

// GET /api/auth/profile
router.get('/profile', authenticate, async (req, res) => {
  const org = await Organization.findById(req.user.organization_id);
  res.json({
    status: 'success',
    data: {
      user: { id: req.user._id, email: req.user.email, full_name: req.user.full_name, role: req.user.role, last_login: req.user.last_login, created_at: req.user.created_at },
      organization: org ? { id: org._id, name: org.name, industry: org.industry, subscription_tier: org.subscription_tier } : null,
    },
  });
});

export default router;
