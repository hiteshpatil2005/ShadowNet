import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import MonitoringConfig from '../models/MonitoringConfig.js';

const router = Router();

// GET /api/monitoring/config
router.get('/config', authenticate, async (req, res, next) => {
  try {
    let config = await MonitoringConfig.findOne({ organization_id: req.organizationId });
    if (!config) {
      config = await MonitoringConfig.create({
        organization_id: req.organizationId,
        monitoring_enabled: true,
        scan_interval: 24,
        ti_sources_enabled: ['alienvault', 'abuseipdb', 'virustotal', 'crtsh', 'urlscan', 'nvd', 'ripestat'],
        alert_rules: [],
      });
    }
    res.json({ status: 'success', data: config });
  } catch (error) { next(error); }
});

// PUT /api/monitoring/config
router.put('/config', authenticate, async (req, res, next) => {
  try {
    const { monitoring_enabled, scan_interval, ti_sources_enabled, notification_channels, notification_preferences } = req.body;
    const update = {};
    if (monitoring_enabled !== undefined) update.monitoring_enabled = monitoring_enabled;
    if (scan_interval) update.scan_interval = scan_interval;
    if (ti_sources_enabled) update.ti_sources_enabled = ti_sources_enabled;
    if (notification_channels) update.notification_channels = notification_channels;
    if (notification_preferences) update.notification_preferences = notification_preferences;

    const config = await MonitoringConfig.findOneAndUpdate(
      { organization_id: req.organizationId },
      { $set: update }, { new: true, upsert: true }
    );
    res.json({ status: 'success', data: config });
  } catch (error) { next(error); }
});

// GET /api/monitoring/rules
router.get('/rules', authenticate, async (req, res, next) => {
  try {
    const config = await MonitoringConfig.findOne({ organization_id: req.organizationId });
    res.json({ status: 'success', data: config?.alert_rules || [] });
  } catch (error) { next(error); }
});

// POST /api/monitoring/rules
router.post('/rules', authenticate, async (req, res, next) => {
  try {
    const { keyword, type } = req.body;
    if (!keyword || !type) return res.status(400).json({ status: 'error', message: 'keyword and type are required.' });

    const config = await MonitoringConfig.findOneAndUpdate(
      { organization_id: req.organizationId },
      { $push: { alert_rules: { keyword, type, active: true } } },
      { new: true, upsert: true }
    );
    res.json({ status: 'success', data: config.alert_rules });
  } catch (error) { next(error); }
});

// PUT /api/monitoring/rules/:id
router.put('/rules/:id', authenticate, async (req, res, next) => {
  try {
    const { active } = req.body;
    const config = await MonitoringConfig.findOne({ organization_id: req.organizationId });
    if (!config) return res.status(404).json({ status: 'error', message: 'Config not found.' });

    const rule = config.alert_rules.id(req.params.id);
    if (!rule) return res.status(404).json({ status: 'error', message: 'Rule not found.' });

    if (active !== undefined) rule.active = active;
    await config.save();
    res.json({ status: 'success', data: config.alert_rules });
  } catch (error) { next(error); }
});

// DELETE /api/monitoring/rules/:id
router.delete('/rules/:id', authenticate, async (req, res, next) => {
  try {
    const config = await MonitoringConfig.findOne({ organization_id: req.organizationId });
    if (!config) return res.status(404).json({ status: 'error', message: 'Config not found.' });

    config.alert_rules = config.alert_rules.filter(r => r._id.toString() !== req.params.id);
    await config.save();
    res.json({ status: 'success', data: config.alert_rules });
  } catch (error) { next(error); }
});

export default router;
