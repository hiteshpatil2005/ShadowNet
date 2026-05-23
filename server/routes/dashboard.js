import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import ExposureEvent from '../models/ExposureEvent.js';
import Correlation from '../models/Correlation.js';
import AttackPath from '../models/AttackPath.js';

const router = Router();

// GET /api/dashboard/overview
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [totalAssets, criticalAssets, highAssets, totalCredentials, criticalCreds, totalCorrelations, totalAlerts, unresolvedAlerts, attackPaths] = await Promise.all([
      DigitalAsset.countDocuments({ organization_id: orgId }),
      DigitalAsset.countDocuments({ organization_id: orgId, risk_level: 'critical' }),
      DigitalAsset.countDocuments({ organization_id: orgId, risk_level: 'high' }),
      LeakedCredential.countDocuments({ organization_id: orgId }),
      LeakedCredential.countDocuments({ organization_id: orgId, severity: 'CRITICAL' }),
      Correlation.countDocuments({ organization_id: orgId }),
      ExposureEvent.countDocuments({ organization_id: orgId }),
      ExposureEvent.countDocuments({ organization_id: orgId, status: { $nin: ['Resolved', 'Closed'] } }),
      AttackPath.countDocuments({ organization_id: orgId }),
    ]);

    const avgRiskScore = await DigitalAsset.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: null, avg: { $avg: '$risk_score' } } },
    ]);

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
        average_risk_score: Math.round(avgRiskScore[0]?.avg || 0),
        risk_trend: 'increasing',
      },
    });
  } catch (error) { next(error); }
});

// GET /api/dashboard/metrics
router.get('/metrics', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const assetsByType = await DigitalAsset.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: '$asset_type', count: { $sum: 1 } } },
    ]);
    const assetsByRisk = await DigitalAsset.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: '$risk_level', count: { $sum: 1 } } },
    ]);
    const alertsBySeverity = await ExposureEvent.aggregate([
      { $match: { organization_id: orgId } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    res.json({
      status: 'success',
      data: {
        assets_by_type: Object.fromEntries(assetsByType.map(a => [a._id, a.count])),
        assets_by_risk: Object.fromEntries(assetsByRisk.map(a => [a._id, a.count])),
        alerts_by_severity: Object.fromEntries(alertsBySeverity.map(a => [a._id, a.count])),
      },
    });
  } catch (error) { next(error); }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authenticate, async (req, res, next) => {
  try {
    const events = await ExposureEvent.find({ organization_id: req.organizationId })
      .sort({ timestamp: -1 }).limit(20);
    res.json({ status: 'success', data: events });
  } catch (error) { next(error); }
});

// GET /api/dashboard/risk-summary
router.get('/risk-summary', authenticate, async (req, res, next) => {
  try {
    const orgId = req.organizationId;
    const [assets, creds, correlations] = await Promise.all([
      DigitalAsset.find({ organization_id: orgId, risk_level: { $in: ['critical', 'high'] } }).limit(10),
      LeakedCredential.find({ organization_id: orgId, severity: { $in: ['CRITICAL', 'HIGH'] } }).limit(10),
      Correlation.find({ organization_id: orgId }).sort({ risk_score: -1 }).limit(5),
    ]);

    res.json({
      status: 'success',
      data: { critical_assets: assets, critical_credentials: creds, top_correlations: correlations },
    });
  } catch (error) { next(error); }
});

export default router;
