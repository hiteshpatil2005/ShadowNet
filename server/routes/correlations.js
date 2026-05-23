import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import Correlation from '../models/Correlation.js';
import { runCorrelationAnalysis, getCorrelationMatrix } from '../services/correlationEngine.js';

const router = Router();

// GET /api/correlations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { severity, page = 1, limit = 50 } = req.query;
    const query = { organization_id: req.organizationId };
    if (severity) query.severity = severity;

    const total = await Correlation.countDocuments(query);
    const correlations = await Correlation.find(query)
      .sort({ risk_score: -1 })
      .skip((Math.max(1, parseInt(page)) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ status: 'success', data: correlations, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

// GET /api/correlations/matrix
router.get('/matrix', authenticate, async (req, res, next) => {
  try {
    const matrix = await getCorrelationMatrix(req.organizationId);
    res.json({ status: 'success', data: matrix });
  } catch (error) { next(error); }
});

// GET /api/correlations/risky-combinations
router.get('/risky-combinations', authenticate, async (req, res, next) => {
  try {
    const correlations = await Correlation.find({ organization_id: req.organizationId, risk_score: { $gte: 70 } })
      .sort({ risk_score: -1 }).limit(10);
    res.json({ status: 'success', data: correlations });
  } catch (error) { next(error); }
});

// GET /api/correlations/:correlation_id
router.get('/:correlation_id', authenticate, async (req, res, next) => {
  try {
    const corr = await Correlation.findOne({ _id: req.params.correlation_id, organization_id: req.organizationId });
    if (!corr) return res.status(404).json({ status: 'error', message: 'Correlation not found.' });
    res.json({ status: 'success', data: corr });
  } catch (error) { next(error); }
});

// POST /api/correlations/analyze
router.post('/analyze', authenticate, async (req, res, next) => {
  try {
    const correlations = await runCorrelationAnalysis(req.organizationId);
    res.json({ status: 'success', data: correlations, message: `${correlations.length} correlations identified.` });
  } catch (error) { next(error); }
});

export default router;
