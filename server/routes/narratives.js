import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import RiskNarrative from '../models/RiskNarrative.js';
import DigitalAsset from '../models/DigitalAsset.js';
import Correlation from '../models/Correlation.js';
import AttackPath from '../models/AttackPath.js';
import { generateNarrative } from '../services/geminiService.js';

const router = Router();

// GET /api/narratives
router.get('/', authenticate, async (req, res, next) => {
  try {
    const narratives = await RiskNarrative.find({ organization_id: req.organizationId }).sort({ generated_at: -1 });
    res.json({ status: 'success', data: narratives });
  } catch (error) { next(error); }
});

// GET /api/narratives/executive-summary
router.get('/executive-summary', authenticate, async (req, res, next) => {
  try {
    let narrative = await RiskNarrative.findOne({ organization_id: req.organizationId, narrative_type: 'executive_summary' }).sort({ generated_at: -1 });
    if (!narrative) {
      // Auto-generate one
      const assets = await DigitalAsset.find({ organization_id: req.organizationId }).limit(10);
      const correlations = await Correlation.find({ organization_id: req.organizationId }).limit(5);
      const data = { assets: assets.map(a => ({ type: a.asset_type, value: a.asset_value, risk: a.risk_level })), correlations: correlations.map(c => ({ title: c.title, score: c.risk_score })) };
      const generated = await generateNarrative('executive_summary', data);
      narrative = await RiskNarrative.create({ organization_id: req.organizationId, narrative_type: 'executive_summary', ...generated });
    }
    res.json({ status: 'success', data: narrative });
  } catch (error) { next(error); }
});

// GET /api/narratives/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const narrative = await RiskNarrative.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!narrative) return res.status(404).json({ status: 'error', message: 'Narrative not found.' });
    res.json({ status: 'success', data: narrative });
  } catch (error) { next(error); }
});

// POST /api/narratives/generate
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { narrative_type = 'executive_summary' } = req.body;
    const [assets, correlations, attackPaths] = await Promise.all([
      DigitalAsset.find({ organization_id: req.organizationId }).limit(15),
      Correlation.find({ organization_id: req.organizationId }).sort({ risk_score: -1 }).limit(10),
      AttackPath.find({ organization_id: req.organizationId }).limit(5),
    ]);

    const data = {
      assets: assets.map(a => ({ type: a.asset_type, value: a.asset_value, risk: a.risk_level, score: a.risk_score })),
      correlations: correlations.map(c => ({ title: c.title, score: c.risk_score, type: c.correlation_type })),
      attack_paths: attackPaths.map(p => ({ name: p.name, type: p.attack_scenario_type, probability: p.probability })),
    };

    const generated = await generateNarrative(narrative_type, data);
    const narrative = await RiskNarrative.create({ organization_id: req.organizationId, narrative_type, ...generated });

    res.json({ status: 'success', data: narrative });
  } catch (error) { next(error); }
});

export default router;
