import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import AttackPath from '../models/AttackPath.js';
import DigitalAsset from '../models/DigitalAsset.js';
import Correlation from '../models/Correlation.js';
import { generateAttackPaths, generateRemediation } from '../services/geminiService.js';

const router = Router();

// GET /api/attack-paths
router.get('/', authenticate, async (req, res, next) => {
  try {
    const paths = await AttackPath.find({ organization_id: req.organizationId }).sort({ success_probability: -1 });
    res.json({ status: 'success', data: paths });
  } catch (error) { next(error); }
});

// GET /api/attack-paths/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const path = await AttackPath.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!path) return res.status(404).json({ status: 'error', message: 'Attack path not found.' });
    res.json({ status: 'success', data: path });
  } catch (error) { next(error); }
});

// POST /api/attack-paths/simulate
router.post('/simulate', authenticate, async (req, res, next) => {
  try {
    const assets = await DigitalAsset.find({ organization_id: req.organizationId }).limit(20);
    const correlations = await Correlation.find({ organization_id: req.organizationId }).sort({ risk_score: -1 }).limit(10);

    let paths = await generateAttackPaths(
      assets.map(a => ({ type: a.asset_type, value: a.asset_value, risk: a.risk_level, score: a.risk_score })),
      correlations.map(c => ({ title: c.title, type: c.correlation_type, score: c.risk_score }))
    );
    if (!Array.isArray(paths) || paths.length === 0) {
      paths = [{ name: 'No paths generated', attack_scenario_type: 'credential_abuse', probability: '0%', impact: 'LOW', stages: [], remediation: [], timeline_estimate: 'N/A', ai_reasoning: 'Insufficient data to simulate attack paths.' }];
    }

    // Save generated paths
    const saved = [];
    for (const p of paths) {
      const attackPath = await AttackPath.create({
        organization_id: req.organizationId,
        name: p.name,
        attack_scenario_type: p.attack_scenario_type || 'credential_abuse',
        stages: p.stages || [],
        probability: p.probability || '50%',
        success_probability: parseInt(p.probability) || 50,
        impact: p.impact || 'HIGH',
        remediation: (p.remediation || []).map((r, i) => ({ priority: r.priority || i + 1, action: r.action, details: r.details || '', status: 'Pending' })),
        timeline_estimate: p.timeline_estimate || '1-3 days',
        ai_reasoning: p.ai_reasoning || '',
      });
      saved.push(attackPath);
    }

    res.json({ status: 'success', data: saved });
  } catch (error) { next(error); }
});

// GET /api/attack-paths/:id/recommendations
router.get('/:id/recommendations', authenticate, async (req, res, next) => {
  try {
    const path = await AttackPath.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!path) return res.status(404).json({ status: 'error', message: 'Attack path not found.' });

    const recommendations = await generateRemediation(path.toObject());
    res.json({ status: 'success', data: recommendations });
  } catch (error) { next(error); }
});

// PUT /api/attack-paths/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { remediation } = req.body;
    const update = {};
    if (remediation) update.remediation = remediation;

    const path = await AttackPath.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: update }, { new: true }
    );
    if (!path) return res.status(404).json({ status: 'error', message: 'Attack path not found.' });
    res.json({ status: 'success', data: path });
  } catch (error) { next(error); }
});

export default router;
