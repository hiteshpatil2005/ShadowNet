/**
 * ShadowNet AI — Reports Route
 * AI-generated executive security reports + export support.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Correlation from '../models/Correlation.js';
import AttackPath from '../models/AttackPath.js';
import Investigation from '../models/Investigation.js';
import ExposureEvent from '../models/ExposureEvent.js';
import { generateFullReport, generateThreatIntelSummary, generateNarrative } from '../services/geminiService.js';
import env from '../config/env.js';

const router = Router();

// GET /api/reports — list saved reports (placeholder — could be expanded to save reports)
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Return summary stats for report generation
    const orgId = req.organizationId;
    const [assets, creds, corrs, attacks, investigations] = await Promise.all([
      DigitalAsset.countDocuments({ organization_id: orgId }),
      LeakedCredential.countDocuments({ organization_id: orgId }),
      Correlation.countDocuments({ organization_id: orgId }),
      AttackPath.countDocuments({ organization_id: orgId }),
      Investigation.countDocuments({ organization_id: orgId }),
    ]);

    res.json({
      status: 'success',
      data: {
        available_data: { assets, credentials: creds, correlations: corrs, attack_paths: attacks, investigations },
        can_generate: assets > 0 || investigations > 0,
        requires_gemini: !env.GEMINI_API_KEY,
      },
    });
  } catch (error) { next(error); }
});

// POST /api/reports/ai-generate — Full Gemini AI executive security report
router.post('/ai-generate', authenticate, async (req, res, next) => {
  try {
    if (!env.GEMINI_API_KEY) {
      return res.status(400).json({
        status: 'error',
        message: 'GEMINI_API_KEY is not configured. Add it to server/.env to enable AI report generation.',
      });
    }

    const orgId = req.organizationId;
    const [assets, credentials, correlations, investigations, attackPaths] = await Promise.all([
      DigitalAsset.find({ organization_id: orgId }).limit(30).lean(),
      LeakedCredential.find({ organization_id: orgId }).limit(20).lean(),
      Correlation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(15).lean(),
      Investigation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(20).lean(),
      AttackPath.find({ organization_id: orgId }).limit(5).lean(),
    ]);

    if (assets.length === 0 && investigations.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No data available for report generation. Investigate some indicators first.',
      });
    }

    const result = await generateFullReport(assets, credentials, correlations, investigations, attackPaths);

    if (result.error) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    res.json({
      status: 'success',
      data: {
        report: result.report,
        generated_at: new Date().toISOString(),
        data_sources: {
          assets_analyzed: assets.length,
          credentials_analyzed: credentials.length,
          correlations_analyzed: correlations.length,
          investigations_analyzed: investigations.length,
          attack_paths_analyzed: attackPaths.length,
        },
      },
    });
  } catch (error) { next(error); }
});

// POST /api/reports/threat-intel-summary — Gemini summary of investigations
router.post('/threat-intel-summary', authenticate, async (req, res, next) => {
  try {
    if (!env.GEMINI_API_KEY) {
      return res.status(400).json({ status: 'error', message: 'GEMINI_API_KEY not configured.' });
    }

    const investigations = await Investigation.find({ organization_id: req.organizationId })
      .sort({ risk_score: -1 }).limit(20).lean();

    if (!investigations.length) {
      return res.status(400).json({ status: 'error', message: 'No investigations found.' });
    }

    const summary = await generateThreatIntelSummary(investigations);
    res.json({ status: 'success', data: summary });
  } catch (error) { next(error); }
});

// POST /api/reports/narrative — Custom narrative
router.post('/narrative', authenticate, async (req, res, next) => {
  try {
    const { type = 'executive', scope = 'full' } = req.body;
    const orgId = req.organizationId;

    const [assets, creds, corrs, investigations] = await Promise.all([
      DigitalAsset.find({ organization_id: orgId }).limit(20).lean(),
      LeakedCredential.find({ organization_id: orgId }).limit(10).lean(),
      Correlation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(10).lean(),
      Investigation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(10).lean(),
    ]);

    const narrative = await generateNarrative(type, { assets, credentials: creds, correlations: corrs, investigations });
    res.json({ status: 'success', data: narrative });
  } catch (error) { next(error); }
});

// GET /api/reports/live-stats — live dashboard stats for report page
router.get('/live-stats', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [
      totalAssets, criticalAssets, highAssets,
      totalCreds, criticalCreds,
      totalCorrs, criticalCorrs,
      totalAlerts, openAlerts,
      totalInvestigations, maliciousInv,
      attackPaths,
    ] = await Promise.all([
      DigitalAsset.countDocuments({ organization_id: orgId }),
      DigitalAsset.countDocuments({ organization_id: orgId, risk_level: 'critical' }),
      DigitalAsset.countDocuments({ organization_id: orgId, risk_level: 'high' }),
      LeakedCredential.countDocuments({ organization_id: orgId }),
      LeakedCredential.countDocuments({ organization_id: orgId, severity: 'CRITICAL' }),
      Correlation.countDocuments({ organization_id: orgId }),
      Correlation.countDocuments({ organization_id: orgId, severity: 'CRITICAL' }),
      ExposureEvent.countDocuments({ organization_id: orgId }),
      ExposureEvent.countDocuments({ organization_id: orgId, status: { $nin: ['Resolved', 'Closed'] } }),
      Investigation.countDocuments({ organization_id: orgId }),
      Investigation.countDocuments({ organization_id: orgId, verdict: 'malicious' }),
      AttackPath.countDocuments({ organization_id: orgId }),
    ]);

    const avgRisk = await DigitalAsset.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: null, avg: { $avg: '$risk_score' } } },
    ]);

    res.json({
      status: 'success',
      data: {
        total_assets: totalAssets,
        critical_assets: criticalAssets,
        high_assets: highAssets,
        total_credentials: totalCreds,
        critical_credentials: criticalCreds,
        total_correlations: totalCorrs,
        critical_correlations: criticalCorrs,
        total_alerts: totalAlerts,
        open_alerts: openAlerts,
        total_investigations: totalInvestigations,
        malicious_indicators: maliciousInv,
        attack_paths: attackPaths,
        average_risk_score: Math.round(avgRisk[0]?.avg || 0),
        has_data: totalAssets > 0 || totalInvestigations > 0,
      },
    });
  } catch (error) { next(error); }
});

export default router;
