import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import ExposureEvent from '../models/ExposureEvent.js';

const router = Router();

// GET /api/alerts/feed
router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const { severity, status, page = 1, limit = 50, category } = req.query;
    const query = { organization_id: req.organizationId };
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (category) query.category = category;

    const total = await ExposureEvent.countDocuments(query);
    const alerts = await ExposureEvent.find(query)
      .sort({ timestamp: -1 })
      .skip((Math.max(1, parseInt(page)) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ status: 'success', data: alerts, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

// GET /api/alerts/count
router.get('/count', authenticate, async (req, res, next) => {
  try {
    const counts = await ExposureEvent.aggregate([
      { $match: { organization_id: req.organizationId, acknowledged: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const result = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
    counts.forEach(c => { result[c._id] = c.count; });
    res.json({ status: 'success', data: result });
  } catch (error) { next(error); }
});

// POST /api/alerts/:id/acknowledge
router.post('/:id/acknowledge', authenticate, async (req, res, next) => {
  try {
    const alert = await ExposureEvent.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: { acknowledged: true, acknowledged_by: req.user._id, acknowledged_at: new Date(), status: 'Acknowledged' } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ status: 'error', message: 'Alert not found.' });
    res.json({ status: 'success', data: alert });
  } catch (error) { next(error); }
});

// POST /api/alerts/:id/investigate
router.post('/:id/investigate', authenticate, async (req, res, next) => {
  try {
    const { investigation_status, notes } = req.body;
    const update = {};
    if (investigation_status) { update.investigation_status = investigation_status; update.status = investigation_status === 'resolved' ? 'Resolved' : 'Investigating'; }
    if (notes) update.notes = notes;

    const alert = await ExposureEvent.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: update }, { new: true }
    );
    if (!alert) return res.status(404).json({ status: 'error', message: 'Alert not found.' });
    res.json({ status: 'success', data: alert });
  } catch (error) { next(error); }
});

// GET /api/exposure/timeline
router.get('/timeline', authenticate, async (req, res, next) => {
  try {
    const events = await ExposureEvent.find({ organization_id: req.organizationId })
      .sort({ timestamp: -1 }).limit(100);
    res.json({ status: 'success', data: events });
  } catch (error) { next(error); }
});

// GET /api/exposure/metrics
router.get('/metrics', authenticate, async (req, res, next) => {
  try {
    const pipeline = [
      { $match: { organization_id: req.organizationId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] } } } },
      { $sort: { _id: -1 } },
      { $limit: 30 },
    ];
    const metrics = await ExposureEvent.aggregate(pipeline);
    res.json({ status: 'success', data: metrics });
  } catch (error) { next(error); }
});

export default router;
