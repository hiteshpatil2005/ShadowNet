import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import LeakedCredential from '../models/LeakedCredential.js';
import tiOrchestrator from '../services/ti/index.js';

const router = Router();

// GET /api/credentials/leaked
router.get('/leaked', authenticate, async (req, res, next) => {
  try {
    const { severity, page = 1, limit = 50, search } = req.query;
    const query = { organization_id: req.organizationId };
    if (severity) query.severity = severity;
    if (search) query.email = { $regex: search, $options: 'i' };

    const total = await LeakedCredential.countDocuments(query);
    const credentials = await LeakedCredential.find(query)
      .sort({ severity: 1, created_at: -1 })
      .skip((Math.max(1, parseInt(page)) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ status: 'success', data: credentials, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

// GET /api/credentials/:credential_id
router.get('/:credential_id', authenticate, async (req, res, next) => {
  try {
    const cred = await LeakedCredential.findOne({ _id: req.params.credential_id, organization_id: req.organizationId });
    if (!cred) return res.status(404).json({ status: 'error', message: 'Credential not found.' });
    res.json({ status: 'success', data: cred });
  } catch (error) { next(error); }
});

// POST /api/credentials/check
router.post('/check', authenticate, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'error', message: 'Email is required.' });
    const result = await tiOrchestrator.checkCredential(email);
    res.json({ status: 'success', data: result });
  } catch (error) { next(error); }
});

// PUT /api/credentials/:credential_id
router.put('/:credential_id', authenticate, async (req, res, next) => {
  try {
    const { remediation_status, notes } = req.body;
    const update = {};
    if (remediation_status) update.remediation_status = remediation_status;
    if (notes !== undefined) update.notes = notes;

    const cred = await LeakedCredential.findOneAndUpdate(
      { _id: req.params.credential_id, organization_id: req.organizationId },
      { $set: update }, { new: true }
    );
    if (!cred) return res.status(404).json({ status: 'error', message: 'Credential not found.' });
    res.json({ status: 'success', data: cred });
  } catch (error) { next(error); }
});

export default router;
