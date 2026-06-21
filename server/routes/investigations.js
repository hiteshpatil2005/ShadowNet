/**
 * ShadowNet AI — Investigations API
 * CRUD for stored investigation results.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Investigation from '../models/Investigation.js';

const router = Router();

// GET /api/investigations — list all investigations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type, verdict } = req.query;
    const query = { organization_id: req.organizationId };
    if (type) query.indicator_type = type;
    if (verdict) query.verdict = verdict;

    const total = await Investigation.countDocuments(query);
    const investigations = await Investigation.find(query)
      .sort({ investigated_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-sources'); // Exclude heavy sources for list view

    res.json({
      status: 'success',
      data: investigations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) { next(error); }
});

// GET /api/investigations/:id — get full investigation with all source data
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const investigation = await Investigation.findOne({
      _id: req.params.id,
      organization_id: req.organizationId,
    }).populate('linked_asset_id');

    if (!investigation) return res.status(404).json({ status: 'error', message: 'Investigation not found.' });
    res.json({ status: 'success', data: investigation });
  } catch (error) { next(error); }
});

// DELETE /api/investigations/:id — remove from history
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Investigation.findOneAndDelete({ _id: req.params.id, organization_id: req.organizationId });
    res.json({ status: 'success', message: 'Investigation removed from history.' });
  } catch (error) { next(error); }
});

// DELETE /api/investigations — remove ALL investigations for this org
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const result = await Investigation.deleteMany({ organization_id: req.organizationId });
    res.json({ status: 'success', message: `${result.deletedCount} investigations deleted.` });
  } catch (error) { next(error); }
});


// GET /api/investigations/stats/summary — counts by type and verdict
router.get('/stats/summary', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [byType, byVerdict] = await Promise.all([
      Investigation.aggregate([
        { $match: { organization_id: orgId } },
        { $group: { _id: '$indicator_type', count: { $sum: 1 } } },
      ]),
      Investigation.aggregate([
        { $match: { organization_id: orgId } },
        { $group: { _id: '$verdict', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      status: 'success',
      data: {
        by_type: Object.fromEntries(byType.map(b => [b._id, b.count])),
        by_verdict: Object.fromEntries(byVerdict.map(b => [b._id, b.count])),
        total: byType.reduce((s, b) => s + b.count, 0),
      },
    });
  } catch (error) { next(error); }
});

export default router;
