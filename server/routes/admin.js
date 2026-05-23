import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import tiOrchestrator from '../services/ti/index.js';

const router = Router();

// GET /api/admin/organizations
router.get('/organizations', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    res.json({ status: 'success', data: org });
  } catch (error) { next(error); }
});

// GET /api/admin/users
router.get('/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await User.find({ organization_id: req.organizationId }).select('-password_hash -refresh_token');
    res.json({ status: 'success', data: users });
  } catch (error) { next(error); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { role, is_active } = req.body;
    const update = {};
    if (role) update.role = role;
    if (is_active !== undefined) update.is_active = is_active;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: update }, { new: true }
    ).select('-password_hash -refresh_token');
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    res.json({ status: 'success', data: user });
  } catch (error) { next(error); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ status: 'error', message: 'Cannot delete your own account.' });
    const user = await User.findOneAndDelete({ _id: req.params.id, organization_id: req.organizationId });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    res.json({ status: 'success', message: 'User deleted.' });
  } catch (error) { next(error); }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await AuditLog.countDocuments({ organization_id: req.organizationId });
    const logs = await AuditLog.find({ organization_id: req.organizationId })
      .sort({ timestamp: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('user_id', 'email full_name');

    res.json({ status: 'success', data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

// GET /api/admin/api-usage
router.get('/api-usage', authenticate, requireRole('admin'), async (req, res) => {
  const adapterStatus = tiOrchestrator.getAdapterStatus();
  res.json({ status: 'success', data: { adapters: adapterStatus } });
});

export default router;
