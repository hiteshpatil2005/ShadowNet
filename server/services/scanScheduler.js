import Organization from '../models/Organization.js';
import MonitoringConfig from '../models/MonitoringConfig.js';
import tiOrchestrator from './ti/index.js';
import { ingestEnrichment } from './scanIngestion.js';
import { detectTargetType, normalizeTarget } from '../utils/targetDetect.js';
import env from '../config/env.js';

let intervalHandle = null;
let isRunning = false;

export async function runOrgScan(orgId) {
  const config = await MonitoringConfig.findOne({ organization_id: orgId });
  if (!config?.monitoring_enabled) return { skipped: true };

  const targets = (config.scan_targets || []).filter((t) => t.active !== false);
  const results = [];

  for (const t of targets) {
    const raw = t.target || t;
    const normalized = normalizeTarget(raw);
    if (!normalized) continue;

    const type = t.type || detectTargetType(raw);
    try {
      let enrichment;
      if (type === 'ip') enrichment = await tiOrchestrator.enrichIP(normalized);
      else if (type === 'domain') enrichment = await tiOrchestrator.enrichDomain(normalized);
      else if (type === 'url') enrichment = await tiOrchestrator.checkURL(normalized);
      else if (type === 'hash') enrichment = await tiOrchestrator.checkMalware(normalized);
      else if (type === 'cve') enrichment = await tiOrchestrator.lookupCVE(normalized);
      else enrichment = await tiOrchestrator.enrichDomain(normalized);

      if (enrichment && (type === 'ip' || type === 'domain')) {
        await ingestEnrichment(orgId, normalized, enrichment);
      }
      results.push({ target: normalized, type, status: 'ok' });
      t.last_scanned = new Date();
    } catch (err) {
      results.push({ target: normalized, type, status: 'error', error: err.message });
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

      // Default: 15 minutes = 0.25 hours
      const intervalHours = config.scan_interval_hours ?? config.scan_interval ?? 0.25;
      const intervalMs = Math.max(0.25, Number(intervalHours)) * 60 * 60 * 1000;
      const last = config.last_scan_at ? new Date(config.last_scan_at).getTime() : 0;
      if (Date.now() - last < intervalMs) continue;

      console.log(`[SCAN] Running scheduled scan for org ${org._id} (${config.scan_targets.length} targets)`);
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
  // Default poll: every 15 minutes (900000ms)
  const ms = Math.max(60_000, env.SCAN_POLL_MS || 900_000);
  console.log(`[SCAN] Continuous scanner started (check every ${ms / 60000} min)`);
  intervalHandle = setInterval(tick, ms);
  setTimeout(tick, 15_000); // Initial tick 15 seconds after startup
}

export function stopScanScheduler() {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
}

export default { startScanScheduler, stopScanScheduler, runOrgScan };
