/**
 * ShadowNet AI — Attack Paths API
 * Generates attack paths ONLY from real discovered assets using Gemini AI.
 * Never generates fake/demo paths.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import AttackPath from '../models/AttackPath.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Correlation from '../models/Correlation.js';
import Investigation from '../models/Investigation.js';
import { generateAttackPaths, generateRemediation } from '../services/geminiService.js';
import env from '../config/env.js';

const router = Router();

// GET /api/attack-paths
router.get('/', authenticate, async (req, res, next) => {
  try {
    const paths = await AttackPath.find({ organization_id: req.organizationId }).sort({ success_probability: -1, created_at: -1 });
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

// POST /api/attack-paths/simulate — Generate from REAL collected data
router.post('/simulate', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;

    // Guard: require Gemini API key
    if (!env.GEMINI_API_KEY) {
      return res.status(400).json({
        status: 'error',
        message: 'GEMINI_API_KEY is not configured. Add it to server/.env to enable AI attack path generation.',
        requires: 'GEMINI_API_KEY',
      });
    }

    // Fetch ALL real data for context
    const [assets, credentials, correlations, investigations] = await Promise.all([
      DigitalAsset.find({ organization_id: orgId }).limit(30).lean(),
      LeakedCredential.find({ organization_id: orgId }).limit(20).lean(),
      Correlation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(15).lean(),
      Investigation.find({ organization_id: orgId, verdict: { $in: ['malicious', 'suspicious'] } }).limit(10).lean(),
    ]);

    // Guard: require at least some real data
    if (assets.length === 0 && investigations.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No assets or investigations found. Search an IP or domain first, then generate attack paths.',
        requires: 'real_assets',
      });
    }

    // Build rich asset context for Gemini
    const assetContext = assets.map(a => ({
      type: a.asset_type,
      value: a.asset_value,
      ip: a.ip || null,
      ports: a.ports || [],
      services: a.services || null,
      risk_level: a.risk_level,
      risk_score: a.risk_score,
      cves: a.metadata?.cves || [],
      exposure: a.exposure_type,
      sources: a.sources,
      first_discovered: a.first_discovered,
    }));

    const credentialContext = credentials.map(c => ({
      email: c.email,
      severity: c.severity,
      source: c.source,
      breach: c.breach_name,
      type: c.credential_type,
      exposure_count: c.exposure_count,
    }));

    const correlationContext = correlations.map(c => ({
      title: c.title,
      type: c.correlation_type,
      risk_score: c.risk_score,
      severity: c.severity,
      description: c.description,
    }));

    const investigationContext = investigations.map(i => ({
      indicator: i.indicator,
      type: i.indicator_type,
      verdict: i.verdict,
      risk_score: i.risk_score,
      sources_with_data: i.active_sources,
    }));

    // Call Gemini with full real-data context
    const result = await generateAttackPaths(
      assetContext,
      correlationContext,
      credentialContext,
      investigationContext
    );

    if (result.error && !result.paths?.length) {
      return res.status(400).json({ status: 'error', message: result.error });
    }

    const paths = result.paths || [];

    // Save generated paths to DB
    const saved = [];
    for (const p of paths) {
      // Delete old paths to avoid stale buildup
      await AttackPath.deleteMany({ organization_id: orgId, name: p.name });

      const attackPath = await AttackPath.create({
        organization_id: orgId,
        name: p.name,
        attack_scenario_type: p.attack_scenario_type || 'credential_abuse',
        stages: (p.stages || []).map(s => ({
          title: s.title,
          technique: s.technique || '',
          details: s.details || '',
          confidence: s.confidence || '0%',
          real_asset: s.real_asset || '',
          status: 'Simulated Vulnerable',
        })),
        probability: p.probability || '0%',
        success_probability: parseInt(p.probability) || 0,
        impact: p.impact || 'HIGH',
        entry_point: p.entry_point || '',
        target: p.target || '',
        remediation: (p.remediation || []).map((r, i) => ({
          priority: r.priority || i + 1,
          action: r.action,
          details: r.details || '',
          effort: r.effort || 'Medium',
          timeline: r.timeline || 'Week',
          status: 'Pending',
        })),
        timeline_estimate: p.timeline_estimate || '',
        ai_reasoning: p.ai_reasoning || '',
        cvss_max: p.cvss_max || null,
        data_sources: {
          assets_analyzed: assets.length,
          credentials_analyzed: credentials.length,
          correlations_analyzed: correlations.length,
          investigations_analyzed: investigations.length,
        },
      });
      saved.push(attackPath);
    }

    res.json({
      status: 'success',
      data: saved,
      meta: {
        assets_analyzed: assets.length,
        credentials_analyzed: credentials.length,
        paths_generated: saved.length,
      },
    });
  } catch (error) { next(error); }
});

// GET /api/attack-paths/:id/recommendations
router.get('/:id/recommendations', authenticate, async (req, res, next) => {
  try {
    const path = await AttackPath.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!path) return res.status(404).json({ status: 'error', message: 'Attack path not found.' });

    if (!env.GEMINI_API_KEY) {
      return res.json({ status: 'success', data: path.remediation });
    }

    const recommendations = await generateRemediation(path.toObject());
    res.json({ status: 'success', data: recommendations || path.remediation });
  } catch (error) { next(error); }
});

// PUT /api/attack-paths/:id — update remediation status
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { remediation } = req.body;
    const path = await AttackPath.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.organizationId },
      { $set: { remediation } }, { new: true }
    );
    if (!path) return res.status(404).json({ status: 'error', message: 'Attack path not found.' });
    res.json({ status: 'success', data: path });
  } catch (error) { next(error); }
});

// DELETE /api/attack-paths/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await AttackPath.findOneAndDelete({ _id: req.params.id, organization_id: req.organizationId });
    res.json({ status: 'success', message: 'Attack path removed.' });
  } catch (error) { next(error); }
});

export default router;
