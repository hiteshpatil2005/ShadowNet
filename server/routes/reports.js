import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Correlation from '../models/Correlation.js';
import AttackPath from '../models/AttackPath.js';
import ThreatPersona from '../models/ThreatPersona.js';
import RiskNarrative from '../models/RiskNarrative.js';
import ExposureEvent from '../models/ExposureEvent.js';
import { generateNarrative } from '../services/geminiService.js';

const router = Router();
const generatedReports = new Map();

// GET /api/reports
router.get('/', authenticate, async (req, res, next) => {
  try {
    const narratives = await RiskNarrative.find({ organization_id: req.organizationId }).sort({ generated_at: -1 });
    const reports = narratives.map(n => ({
      id: n._id,
      title: n.title,
      type: n.narrative_type,
      generated_at: n.generated_at,
      summary: n.summary,
      confidence_level: n.confidence_level,
    }));
    // Include in-memory reports
    for (const [id, report] of generatedReports) {
      if (report.organization_id?.toString() === req.organizationId.toString()) {
        reports.unshift({ id, ...report });
      }
    }
    res.json({ status: 'success', data: reports });
  } catch (error) { next(error); }
});

// POST /api/reports/generate
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { report_type = 'executive_summary', title = 'Security Assessment Report' } = req.body;
    const orgId = req.organizationId;

    const [assets, credentials, correlations, attackPaths, personas, alerts] = await Promise.all([
      DigitalAsset.find({ organization_id: orgId }),
      LeakedCredential.find({ organization_id: orgId }),
      Correlation.find({ organization_id: orgId }).sort({ risk_score: -1 }),
      AttackPath.find({ organization_id: orgId }),
      ThreatPersona.find({ organization_id: orgId }),
      ExposureEvent.find({ organization_id: orgId }),
    ]);

    const reportData = {
      overview: {
        total_assets: assets.length,
        critical_assets: assets.filter(a => a.risk_level === 'critical').length,
        high_risk_assets: assets.filter(a => a.risk_level === 'high').length,
        total_credentials: credentials.length,
        total_correlations: correlations.length,
        total_attack_paths: attackPaths.length,
        total_alerts: alerts.length,
        unresolved_alerts: alerts.filter(a => !a.acknowledged).length,
      },
      top_risks: correlations.slice(0, 5).map(c => ({ title: c.title, score: c.risk_score, severity: c.severity })),
      attack_paths: attackPaths.map(p => ({ name: p.name, type: p.attack_scenario_type, probability: p.probability, impact: p.impact })),
      threat_personas: personas.map(p => ({ name: p.name, type: p.predicted_attacker_type, confidence: p.confidence })),
      assets_by_risk: { critical: assets.filter(a => a.risk_level === 'critical').length, high: assets.filter(a => a.risk_level === 'high').length, medium: assets.filter(a => a.risk_level === 'medium').length, low: assets.filter(a => a.risk_level === 'low').length },
    };

    // Generate AI narrative
    const narrative = await generateNarrative(report_type, reportData);

    const report = await RiskNarrative.create({
      organization_id: orgId,
      narrative_type: report_type,
      title: title || narrative.title,
      content: narrative.content,
      summary: narrative.summary,
      key_findings: narrative.key_findings,
      business_impact: narrative.business_impact,
      recommended_actions: narrative.recommended_actions,
      confidence_level: narrative.confidence_level,
      supporting_data: reportData,
    });

    res.json({ status: 'success', data: report });
  } catch (error) { next(error); }
});

// GET /api/reports/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const report = await RiskNarrative.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found.' });
    res.json({ status: 'success', data: report });
  } catch (error) { next(error); }
});

// GET /api/reports/:id/export
router.get('/:id/export', authenticate, async (req, res, next) => {
  try {
    const report = await RiskNarrative.findOne({ _id: req.params.id, organization_id: req.organizationId });
    if (!report) return res.status(404).json({ status: 'error', message: 'Report not found.' });

    // Return as downloadable JSON
    const exportData = {
      report_title: report.title,
      report_type: report.narrative_type,
      generated_at: report.generated_at,
      content: report.content,
      summary: report.summary,
      key_findings: report.key_findings,
      business_impact: report.business_impact,
      recommended_actions: report.recommended_actions,
      supporting_data: report.supporting_data,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="shadownet-report-${report._id}.json"`);
    res.json(exportData);
  } catch (error) { next(error); }
});

export default router;
