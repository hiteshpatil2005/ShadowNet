import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import tiOrchestrator from '../services/ti/index.js';

const router = Router();

// GET /api/ti/status — adapter health (admin-friendly)
router.get('/status', authenticate, (req, res) => {
  res.json({ status: 'success', data: tiOrchestrator.getAdapterStatus() });
});

// GET /api/ti/cve/:cveId
router.get('/cve/:cveId', authenticate, async (req, res, next) => {
  try {
    const data = await tiOrchestrator.lookupCVE(req.params.cveId);
    res.json({ status: 'success', data });
  } catch (error) { next(error); }
});

// GET /api/ti/ip/:ip
router.get('/ip/:ip', authenticate, async (req, res, next) => {
  try {
    const data = await tiOrchestrator.enrichIP(req.params.ip);
    res.json({ status: 'success', data });
  } catch (error) { next(error); }
});

// GET /api/ti/domain/:domain
router.get('/domain/:domain', authenticate, async (req, res, next) => {
  try {
    const data = await tiOrchestrator.enrichDomain(req.params.domain);
    res.json({ status: 'success', data });
  } catch (error) { next(error); }
});

export default router;
