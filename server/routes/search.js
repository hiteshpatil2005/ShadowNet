import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import tiOrchestrator from '../services/ti/index.js';
import { ingestEnrichment, summarizeForClient } from '../services/scanIngestion.js';
import { detectTargetType, normalizeTarget } from '../utils/targetDetect.js';

const router = Router();

// GET /api/search/investigate?q=8.8.8.8
router.get('/investigate', authenticate, async (req, res, next) => {
  try {
    const q = normalizeTarget(req.query.q);
    if (!q) return res.status(400).json({ status: 'error', message: 'Query parameter q is required.' });

    const type = detectTargetType(q);
    if (type === 'unknown' || type === 'email') {
      return res.status(400).json({
        status: 'error',
        message: 'Enter a valid IPv4 address or domain name (e.g. 8.8.8.8 or example.com).',
      });
    }

    let enrichment;
    if (type === 'ip') {
      enrichment = await tiOrchestrator.enrichIP(q);
    } else if (type === 'url') {
      enrichment = await tiOrchestrator.checkURL(q);
    } else {
      enrichment = await tiOrchestrator.enrichDomain(q);
    }
    enrichment.type = type;

    const ingested = await ingestEnrichment(req.organizationId, q, enrichment);

    const dbAssets = await DigitalAsset.find({
      organization_id: req.organizationId,
      $or: [
        { asset_value: q },
        { ip: q },
        { asset_value: { $regex: q.replace(/\./g, '\\.'), $options: 'i' } },
      ],
    }).limit(20);

    const dbCreds = type === 'domain'
      ? await LeakedCredential.find({
          organization_id: req.organizationId,
          email: { $regex: q.replace(/\./g, '\\.'), $options: 'i' },
        }).limit(10)
      : [];

    res.json({
      status: 'success',
      data: {
        insights: summarizeForClient(type, q, enrichment),
        ingested,
        db_matches: { assets: dbAssets, credentials: dbCreds },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
