import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import tiOrchestrator from '../services/ti/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const activeScans = new Map();

// GET /api/assets/footprint
router.get('/footprint', authenticate, async (req, res, next) => {
  try {
    const { risk_level, asset_type, page = 1, limit = 50, search } = req.query;
    const query = { organization_id: req.organizationId };
    if (risk_level) query.risk_level = risk_level;
    if (asset_type) query.asset_type = asset_type;
    if (search) query.asset_value = { $regex: search, $options: 'i' };

    const total = await DigitalAsset.countDocuments(query);
    const assets = await DigitalAsset.find(query)
      .sort({ risk_score: -1 })
      .skip((Math.max(1, parseInt(page)) - 1) * parseInt(limit))
      .limit(Math.min(parseInt(limit), 1000));

    res.json({ status: 'success', data: assets, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

// POST /api/assets/scan
router.post('/scan', authenticate, async (req, res, next) => {
  try {
    const { targets, scan_type = 'full' } = req.body;
    const scanId = uuidv4();

    activeScans.set(scanId, { status: 'running', progress: 0, started_at: new Date(), results: [] });

    // Run scan asynchronously
    (async () => {
      try {
        const scan = activeScans.get(scanId);
        const targetList = Array.isArray(targets) ? targets : [targets];
        for (let i = 0; i < targetList.length; i++) {
          const target = targetList[i];
          const enrichment = await tiOrchestrator.fullScan([target]);
          scan.results.push(...enrichment);
          scan.progress = Math.round(((i + 1) / targetList.length) * 100);
        }
        scan.status = 'completed';
        scan.completed_at = new Date();
      } catch (err) {
        const scan = activeScans.get(scanId);
        if (scan) { scan.status = 'failed'; scan.error = err.message; }
      }
    })();

    res.json({ status: 'success', data: { scan_id: scanId, status: 'running', message: 'Scan initiated successfully.' } });
  } catch (error) { next(error); }
});

// GET /api/assets/scan/:scan_id/status
router.get('/scan/:scan_id/status', authenticate, (req, res) => {
  const scan = activeScans.get(req.params.scan_id);
  if (!scan) return res.status(404).json({ status: 'error', message: 'Scan not found.' });
  res.json({ status: 'success', data: { scan_id: req.params.scan_id, ...scan, results: scan.status === 'completed' ? scan.results : undefined } });
});

// GET /api/assets/search
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: 'error', message: 'Search query required.' });
    const assets = await DigitalAsset.find({
      organization_id: req.organizationId,
      $or: [{ asset_value: { $regex: q, $options: 'i' } }, { tags: { $in: [q] } }],
    }).limit(50);
    res.json({ status: 'success', data: assets });
  } catch (error) { next(error); }
});

// GET /api/assets/:asset_id
router.get('/:asset_id', authenticate, async (req, res, next) => {
  try {
    const asset = await DigitalAsset.findOne({ _id: req.params.asset_id, organization_id: req.organizationId });
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found.' });

    // Enrich with TI data
    let enrichment = null;
    try {
      const type = asset.asset_type === 'ip' ? 'ip' : 'domain';
      if (type === 'ip') enrichment = await tiOrchestrator.enrichIP(asset.asset_value);
      else enrichment = await tiOrchestrator.enrichDomain(asset.asset_value);
    } catch { /* TI enrichment optional */ }

    res.json({ status: 'success', data: { ...asset.toObject(), ti_enrichment: enrichment } });
  } catch (error) { next(error); }
});

// PUT /api/assets/:asset_id
router.put('/:asset_id', authenticate, async (req, res, next) => {
  try {
    const { tags, remediation_status, notes, risk_level } = req.body;
    const update = {};
    if (tags) update.tags = tags;
    if (remediation_status) update.remediation_status = remediation_status;
    if (notes !== undefined) update.notes = notes;
    if (risk_level) update.risk_level = risk_level;

    const asset = await DigitalAsset.findOneAndUpdate(
      { _id: req.params.asset_id, organization_id: req.organizationId },
      { $set: update }, { new: true }
    );
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found.' });
    res.json({ status: 'success', data: asset });
  } catch (error) { next(error); }
});

// DELETE /api/assets/:asset_id
router.delete('/:asset_id', authenticate, async (req, res, next) => {
  try {
    const asset = await DigitalAsset.findOneAndDelete({ _id: req.params.asset_id, organization_id: req.organizationId });
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found.' });
    res.json({ status: 'success', message: 'Asset deleted successfully.' });
  } catch (error) { next(error); }
});

export default router;
