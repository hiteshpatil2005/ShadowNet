import Organization from '../models/Organization.js';
import MonitoringConfig from '../models/MonitoringConfig.js';
import tiOrchestrator from './ti/index.js';
import { ingestEnrichment } from './scanIngestion.js';
import { normalizeTarget } from '../utils/targetDetect.js';
import env from '../config/env.js';

let intervalHandle = null;
let isRunning = false;

export async function runOrgScan(orgId) {
  const config = await MonitoringConfig.findOne({ organization_id: orgId });
  if (!config?.monitoring_enabled) return { skipped: true };

  const targets = (config.scan_targets || []).filter((t) => t.active !== false);
  const results = [];

  for (const t of targets) {
    const target = normalizeTarget(t.target);
    if (!target) continue;
    try {
      let enrichment;
      if (t.type === 'ip' || /^\d{1,3}(\.\d{1,3}){3}$/.test(target)) {
        enrichment = await tiOrchestrator.enrichIP(target);
      } else {
        enrichment = await tiOrchestrator.enrichDomain(target);
      }
      enrichment.type = t.type || (enrichment.ip ? 'ip' : 'domain');
      const ingested = await ingestEnrichment(orgId, target, enrichment);
      results.push({ target, status: 'ok', ingested });
      t.last_scanned = new Date();
    } catch (err) {
      results.push({ target, status: 'error', error: err.message });
    }
  }

  config.last_scan_at = new Date();
  config.last_scan_status = results.some((r) => r.status === 'error') ? 'partial' : 'completed';
  config.last_scan_results = results;
  await config.save();

  return { orgId, results };
}

async function tick() {
  if (isRunning) return;
  isRunning = true;
  try {
    const orgs = await Organization.find({});
    for (const org of orgs) {
      const config = await MonitoringConfig.findOne({ organization_id: org._id });
      if (!config?.monitoring_enabled || !(config.scan_targets || []).length) continue;

      const intervalHours = config.scan_interval_hours ?? (config.scan_interval > 12 ? config.scan_interval / 60 : config.scan_interval) ?? 1;
      const intervalMs = Math.max(5, Number(intervalHours)) * 60 * 60 * 1000;
      const last = config.last_scan_at ? new Date(config.last_scan_at).getTime() : 0;
      if (Date.now() - last < intervalMs) continue;

      console.log(`[SCAN] Running scheduled scan for org ${org._id}`);
      await runOrgScan(org._id);
    }
  } catch (err) {
    console.error('[SCAN] Scheduler error:', err.message);
  } finally {
    isRunning = false;
  }
}

export function startScanScheduler() {
  if (intervalHandle) return;
  const ms = Math.max(60_000, env.SCAN_POLL_MS);
  console.log(`[SCAN] Continuous scanner started (check every ${ms / 1000}s)`);
  intervalHandle = setInterval(tick, ms);
  setTimeout(tick, 10_000);
}

export function stopScanScheduler() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}

export default { startScanScheduler, stopScanScheduler, runOrgScan };
