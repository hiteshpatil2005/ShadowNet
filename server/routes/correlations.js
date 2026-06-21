/**
 * ShadowNet AI — Correlations Route
 * Full CRUD + auto-analysis + Gemini enrichment + delete support.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Correlation from '../models/Correlation.js';
import { runCorrelationAnalysis, getCorrelationMatrix } from '../services/correlationEngine.js';

const router = Router();

// GET /api/correlations — list all with optional severity filter
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { severity, type, page = 1, limit = 100 } = req.query;
    const query = { organization_id: req.organizationId };
    if (severity) query.severity = severity;
    if (type) query.correlation_type = type;

    const total = await Correlation.countDocuments(query);
    const correlations = await Correlation.find(query)
      .sort({ risk_score: -1 })
      .skip((Math.max(1, parseInt(page)) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      data: correlations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) { next(error); }
});

// GET /api/correlations/matrix — risk matrix
router.get('/matrix', authenticate, async (req, res, next) => {
  try {
    const matrix = await getCorrelationMatrix(req.organizationId);
    res.json({ status: 'success', data: matrix });
  } catch (error) { next(error); }
});

// GET /api/correlations/risky-combinations — top critical correlations
router.get('/risky-combinations', authenticate, async (req, res, next) => {
  try {
    const correlations = await Correlation.find({
      organization_id: req.organizationId,
      risk_score: { $gte: 70 },
    }).sort({ risk_score: -1 }).limit(10);
    res.json({ status: 'success', data: correlations });
  } catch (error) { next(error); }
});

// GET /api/correlations/stats — summary counts
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [bySeverity, byType, lastRun] = await Promise.all([
      Correlation.aggregate([
        { $match: { organization_id: orgId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Correlation.aggregate([
        { $match: { organization_id: orgId } },
        { $group: { _id: '$correlation_type', count: { $sum: 1 } } },
      ]),
      Correlation.findOne({ organization_id: orgId }).sort({ created_at: -1 }).select('created_at'),
    ]);

    res.json({
      status: 'success',
      data: {
        total: bySeverity.reduce((s, b) => s + b.count, 0),
        by_severity: Object.fromEntries(bySeverity.map(b => [b._id, b.count])),
        by_type: Object.fromEntries(byType.map(b => [b._id, b.count])),
        last_analyzed: lastRun?.created_at || null,
      },
    });
  } catch (error) { next(error); }
});

// GET /api/correlations/:id — single correlation with full details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (['matrix', 'risky-combinations', 'stats', 'analyze'].includes(req.params.id)) return next();
    const corr = await Correlation.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!corr) return res.status(404).json({ status: 'error', message: 'Correlation not found.' });
    res.json({ status: 'success', data: corr });
  } catch (error) { next(error); }
});

// POST /api/correlations/analyze — run full analysis
router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    const correlations = await runCorrelationAnalysis(req.organizationId);
    res.json({
      status: 'success',
      data: correlations,
      message: `${correlations.length} correlations identified and saved.`,
    });
  } catch (error) { next(error); }
});

// DELETE /api/correlations/:id — delete single correlation
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Correlation.findOneAndDelete({ _id: req.params.id, organization_id: req.organizationId });
    res.json({ status: 'success', message: 'Correlation deleted.' });
  } catch (error) { next(error); }
});

// DELETE /api/correlations — delete ALL correlations for this org
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const result = await Correlation.deleteMany({ organization_id: req.organizationId });
    res.json({ status: 'success', message: `${result.deletedCount} correlations deleted.` });
  } catch (error) { next(error); }
});

export default router;
