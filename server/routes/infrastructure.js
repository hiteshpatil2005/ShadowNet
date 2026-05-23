import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import Correlation from '../models/Correlation.js';

const router = Router();

// GET /api/infrastructure/graph
router.get('/graph', authenticate, async (req, res, next) => {
  try {
    const assets = await DigitalAsset.find({ organization_id: req.organizationId });
    const correlations = await Correlation.find({ organization_id: req.organizationId });

    // Build React Flow compatible nodes and edges
    const nodes = [];
    const edges = [];
    const positions = {};
    let x = 0, y = 0;

    // Create nodes from assets
    assets.forEach((asset, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const nodeType = getNodeType(asset.asset_type);
      nodes.push({
        id: asset._id.toString(),
        type: 'default',
        position: { x: 100 + col * 280, y: 100 + row * 200 },
        data: {
          label: asset.asset_value,
          assetType: asset.asset_type,
          riskLevel: asset.risk_level,
          riskScore: asset.risk_score,
          ip: asset.ip || '',
          ports: asset.ports || [],
          services: asset.services || '',
          cloudProvider: asset.cloud_provider || '',
        },
        style: getNodeStyle(asset.risk_level),
      });
      positions[asset.asset_value] = asset._id.toString();
    });

    // Create edges from correlations
    correlations.forEach((corr, i) => {
      const sourceId = Object.entries(positions).find(([k]) => corr.asset_id_1 === k || corr.service === k)?.[1];
      const targetId = Object.entries(positions).find(([k]) => corr.asset_id_2 === k || corr.credential?.includes(k.split('.').pop()))?.[1];

      if (sourceId && targetId && sourceId !== targetId) {
        edges.push({
          id: `e-${corr._id}`,
          source: sourceId,
          target: targetId,
          label: corr.correlation_type?.replace(/_/g, ' ') || '',
          type: 'smoothstep',
          animated: corr.risk_score >= 70,
          style: { stroke: corr.risk_score >= 80 ? '#ef4444' : corr.risk_score >= 60 ? '#f59e0b' : '#6b7280' },
        });
      }
    });

    // Add implicit IP-based edges
    const ipMap = {};
    assets.forEach(a => {
      if (a.ip) {
        if (!ipMap[a.ip]) ipMap[a.ip] = [];
        ipMap[a.ip].push(a._id.toString());
      }
    });
    Object.values(ipMap).forEach(ids => {
      for (let i = 0; i < ids.length - 1; i++) {
        edges.push({
          id: `e-ip-${ids[i]}-${ids[i+1]}`,
          source: ids[i],
          target: ids[i+1],
          label: 'shared IP',
          type: 'smoothstep',
          style: { stroke: '#8b5cf6', strokeDasharray: '5 5' },
        });
      }
    });

    res.json({ status: 'success', data: { nodes, edges } });
  } catch (error) { next(error); }
});

// GET /api/infrastructure/graph/search
router.get('/graph/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: 'error', message: 'Search query required.' });
    const assets = await DigitalAsset.find({
      organization_id: req.organizationId,
      asset_value: { $regex: q, $options: 'i' },
    });
    res.json({ status: 'success', data: assets.map(a => a._id) });
  } catch (error) { next(error); }
});

// GET /api/infrastructure/relationships
router.get('/relationships', authenticate, async (req, res, next) => {
  try {
    const correlations = await Correlation.find({ organization_id: req.organizationId }).sort({ risk_score: -1 });
    res.json({ status: 'success', data: correlations });
  } catch (error) { next(error); }
});

function getNodeType(assetType) {
  const map = { domain: 'input', subdomain: 'default', ip: 'default', service: 'output', cloud_resource: 'output', credential: 'output' };
  return map[assetType] || 'default';
}

function getNodeStyle(riskLevel) {
  const styles = {
    critical: { background: '#1a1a2e', border: '2px solid #ef4444', borderRadius: '12px', padding: '10px', color: '#f87171' },
    high: { background: '#1a1a2e', border: '2px solid #f59e0b', borderRadius: '12px', padding: '10px', color: '#fbbf24' },
    medium: { background: '#1a1a2e', border: '2px solid #3b82f6', borderRadius: '12px', padding: '10px', color: '#60a5fa' },
    low: { background: '#1a1a2e', border: '2px solid #10b981', borderRadius: '12px', padding: '10px', color: '#34d399' },
  };
  return styles[riskLevel] || styles.medium;
}

export default router;
