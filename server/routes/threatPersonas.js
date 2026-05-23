import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import ThreatPersona from '../models/ThreatPersona.js';
import Organization from '../models/Organization.js';
import DigitalAsset from '../models/DigitalAsset.js';
import { predictThreatPersonas } from '../services/geminiService.js';

const router = Router();

// GET /api/threat-personas
router.get('/', authenticate, async (req, res, next) => {
  try {
    const personas = await ThreatPersona.find({ organization_id: req.organizationId }).sort({ confidence_score: -1 });
    res.json({ status: 'success', data: personas });
  } catch (error) { next(error); }
});

// GET /api/threat-personas/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const persona = await ThreatPersona.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!persona) return res.status(404).json({ status: 'error', message: 'Threat persona not found.' });
    res.json({ status: 'success', data: persona });
  } catch (error) { next(error); }
});

// POST /api/threat-personas/predict
router.post('/predict', authenticate, async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    const assets = await DigitalAsset.find({ organization_id: req.organizationId }).limit(15);

    const personas = await predictThreatPersonas(
      { name: org?.name, industry: org?.industry, size: org?.size },
      assets.map(a => ({ type: a.asset_type, value: a.asset_value, risk: a.risk_level, score: a.risk_score }))
    );

    const saved = [];
    for (const p of personas) {
      const persona = await ThreatPersona.create({
        organization_id: req.organizationId,
        name: p.name,
        predicted_attacker_type: p.predicted_attacker_type || 'Cybercriminals',
        category: p.category || '',
        origin: p.origin || '',
        motivation: p.motivation || '',
        confidence: p.confidence || '50%',
        confidence_score: parseInt(p.confidence) / 100 || 0.5,
        capability_level: p.capability_level || 'intermediate',
        target_assets: p.target_assets || '',
        description: p.description || '',
        ransom_likelihood: p.ransom_likelihood || '',
        phishing_risk: p.phishing_risk || '',
      });
      saved.push(persona);
    }

    res.json({ status: 'success', data: saved });
  } catch (error) { next(error); }
});

export default router;
