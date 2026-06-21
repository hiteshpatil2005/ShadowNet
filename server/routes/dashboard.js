import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import ExposureEvent from '../models/ExposureEvent.js';
import Correlation from '../models/Correlation.js';
import AttackPath from '../models/AttackPath.js';
import Investigation from '../models/Investigation.js';
import MonitoringConfig from '../models/MonitoringConfig.js';

const router = Router();

// GET /api/dashboard/overview — all live data from MongoDB
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;

    const [
      totalAssets, criticalAssets, highAssets,
      totalCredentials, criticalCreds,
      totalCorrelations,
      totalAlerts, unresolvedAlerts,
      attackPaths,
      totalInvestigations, maliciousInvestigations,
      monitoringConfig,
    ] = await Promise.all([
      DigitalAsset.countDocuments({ organization_id: orgId }),
      DigitalAsset.countDocuments({ organization_id: orgId, risk_level: 'critical' }),
      DigitalAsset.countDocuments({ organization_id: orgId, risk_level: 'high' }),
      LeakedCredential.countDocuments({ organization_id: orgId }),
      LeakedCredential.countDocuments({ organization_id: orgId, severity: 'CRITICAL' }),
      Correlation.countDocuments({ organization_id: orgId }),
      ExposureEvent.countDocuments({ organization_id: orgId }),
      ExposureEvent.countDocuments({ organization_id: orgId, status: { $nin: ['Resolved', 'Closed'] } }),
      AttackPath.countDocuments({ organization_id: orgId }),
      Investigation.countDocuments({ organization_id: orgId }),
      Investigation.countDocuments({ organization_id: orgId, verdict: 'malicious' }),
      MonitoringConfig.findOne({ organization_id: orgId }).select('last_scan_at scan_targets monitoring_enabled'),
    ]);

    const avgRiskAgg = await DigitalAsset.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: null, avg: { $avg: '$risk_score' } } },
    ]);

    // Empty-state: detect if org has any real data
    const hasData = totalAssets > 0 || totalCredentials > 0 || totalInvestigations > 0;

    res.json({
      status: 'success',
      data: {
        total_assets: totalAssets,
        critical_assets: criticalAssets,
        high_risk_assets: highAssets,
        total_credentials_leaked: totalCredentials,
        critical_credentials: criticalCreds,
        total_correlations: totalCorrelations,
        total_alerts: totalAlerts,
        unresolved_alerts: unresolvedAlerts,
        attack_paths: attackPaths,
        total_investigations: totalInvestigations,
        malicious_indicators: maliciousInvestigations,
        average_risk_score: Math.round(avgRiskAgg[0]?.avg || 0),
        last_scan_at: monitoringConfig?.last_scan_at || null,
        monitoring_targets: (monitoringConfig?.scan_targets || []).length,
        monitoring_enabled: monitoringConfig?.monitoring_enabled || false,
        has_data: hasData,
        empty_state: !hasData ? {
          message: 'No intelligence data yet.',
          action: 'Start by searching an IP address, domain, CVE, or file hash in the search bar above.',
        } : null,
      },
    });
  } catch (error) { next(error); }
});

// GET /api/dashboard/metrics
router.get('/metrics', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [assetsByType, assetsByRisk, alertsBySeverity, investigationsByType, investigationsByVerdict] = await Promise.all([
      DigitalAsset.aggregate([{ $match: { organization_id: orgId } }, { $group: { _id: '$asset_type', count: { $sum: 1 } } }]),
      DigitalAsset.aggregate([{ $match: { organization_id: orgId } }, { $group: { _id: '$risk_level', count: { $sum: 1 } } }]),
      ExposureEvent.aggregate([{ $match: { organization_id: orgId } }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Investigation.aggregate([{ $match: { organization_id: orgId } }, { $group: { _id: '$indicator_type', count: { $sum: 1 } } }]),
      Investigation.aggregate([{ $match: { organization_id: orgId } }, { $group: { _id: '$verdict', count: { $sum: 1 } } }]),
    ]);

    res.json({
      status: 'success',
      data: {
        assets_by_type: Object.fromEntries(assetsByType.map(a => [a._id, a.count])),
        assets_by_risk: Object.fromEntries(assetsByRisk.map(a => [a._id, a.count])),
        alerts_by_severity: Object.fromEntries(alertsBySeverity.map(a => [a._id, a.count])),
        investigations_by_type: Object.fromEntries(investigationsByType.map(a => [a._id, a.count])),
        investigations_by_verdict: Object.fromEntries(investigationsByVerdict.map(a => [a._id, a.count])),
      },
    });
  } catch (error) { next(error); }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [events, investigations] = await Promise.all([
      ExposureEvent.find({ organization_id: orgId }).sort({ timestamp: -1 }).limit(10),
      Investigation.find({ organization_id: orgId }).sort({ investigated_at: -1 }).limit(10).select('indicator indicator_type verdict risk_score investigated_at'),
    ]);
    res.json({ status: 'success', data: { events, investigations } });
  } catch (error) { next(error); }
});

// GET /api/dashboard/risk-summary
router.get('/risk-summary', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [assets, creds, correlations, maliciousIndicators] = await Promise.all([
      DigitalAsset.find({ organization_id: orgId, risk_level: { $in: ['critical', 'high'] } }).limit(10),
      LeakedCredential.find({ organization_id: orgId, severity: { $in: ['CRITICAL', 'HIGH'] } }).limit(10),
      Correlation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(5),
      Investigation.find({ organization_id: orgId, verdict: 'malicious' }).sort({ risk_score: -1 }).limit(5).select('indicator indicator_type risk_score verdict investigated_at'),
    ]);

    res.json({
      status: 'success',
      data: { critical_assets: assets, critical_credentials: creds, top_correlations: correlations, malicious_indicators: maliciousIndicators },
    });
  } catch (error) { next(error); }
});

export default router;
