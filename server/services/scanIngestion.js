import DigitalAsset from '../models/DigitalAsset.js';
import ExposureEvent from '../models/ExposureEvent.js';
import { detectTargetType, normalizeTarget } from '../utils/targetDetect.js';

function riskFromAbuseScore(score) {
  if (score >= 75) return { risk_level: 'critical', risk_score: Math.min(100, score + 10) };
  if (score >= 50) return { risk_level: 'high', risk_score: score };
  if (score >= 25) return { risk_level: 'medium', risk_score: score };
  return { risk_level: 'low', risk_score: Math.max(score, 10) };
}

function buildInsightsSummary(type, target, enrichment) {
  const lines = [];
  if (type === 'ip') {
    const abuse = enrichment.abuseipdb;
    const ripe = enrichment.ripestat;
    const vt = enrichment.virustotal;
    if (abuse && !abuse._fallback) {
      lines.push(`AbuseIPDB confidence: ${abuse.abuse_score}% (${abuse.total_reports} reports)`);
      lines.push(`Country: ${abuse.country || '—'} • ISP: ${abuse.isp || '—'}`);
    }
    if (ripe && !ripe._fallback) {
      lines.push(`RIPEstat: ${ripe.holder || 'Unknown'} • ASN ${ripe.asn || '—'} • ${ripe.country || '—'}`);
    }
    if (vt && !vt._fallback && vt.malicious != null) {
      lines.push(`VirusTotal: ${vt.malicious} malicious / ${vt.total || '?'} engines`);
    }
  }
  if (type === 'domain') {
    const crt = enrichment.crtsh;
    if (crt?.subdomains?.length) {
      lines.push(`crt.sh: ${crt.subdomains.length} certificate-derived hostnames`);
    }
    if (enrichment.openphish?.is_phishing || enrichment.phishtank?.in_database) {
      lines.push('Phishing intelligence: URL flagged on phishing feeds');
    }
  }
  if (lines.length === 0) lines.push('TI enrichment completed; review raw sources below.');
  return lines.join('\n');
}

async function upsertAsset(orgId, payload) {
  const existing = await DigitalAsset.findOne({
    organization_id: orgId,
    asset_value: payload.asset_value,
    asset_type: payload.asset_type,
  });

  if (existing) {
    Object.assign(existing, payload);
    existing.last_seen = new Date();
    await existing.save();
    return { asset: existing, created: false };
  }

  const asset = await DigitalAsset.create({
    organization_id: orgId,
    first_discovered: new Date(),
    last_seen: new Date(),
    ...payload,
  });
  return { asset, created: true };
}

async function createAlert(orgId, { asset, title, description, severity, event_type = 'new_exposure' }) {
  const event = await ExposureEvent.create({
    organization_id: orgId,
    asset_id: asset?._id,
    event_type,
    severity,
    title,
    description,
    details: description,
    event: title,
    asset: asset?.asset_value || '',
    category: 'TI Scan',
    timestamp: new Date(),
    status: 'New',
  });
  return event;
}

export async function ingestIpScan(orgId, ip, enrichment) {
  const abuse = enrichment.abuseipdb || {};
  const ripe = enrichment.ripestat || {};
  const risk = abuse.abuse_score != null && !abuse._fallback
    ? riskFromAbuseScore(abuse.abuse_score)
    : { risk_level: 'medium', risk_score: 40 };

  const services = [
    abuse.isp && `ISP: ${abuse.isp}`,
    abuse.usage_type && abuse.usage_type,
    ripe.holder && `Org: ${ripe.holder}`,
  ].filter(Boolean).join(' • ') || 'Internet-facing host';

  const { asset, created } = await upsertAsset(orgId, {
    asset_type: 'ip',
    asset_value: ip,
    ip,
    risk_level: risk.risk_level,
    risk_score: risk.risk_score,
    exposure_type: abuse.abuse_score >= 50 ? 'vulnerable' : 'public',
    sources: ['TI Scan', 'AbuseIPDB', 'RIPEstat', 'AlienVault OTX'].filter((s) => enrichment[s.toLowerCase?.()?.replace(/\s/g, '')] || s === 'TI Scan'),
    services,
    metadata: { ti_enrichment: enrichment, ripestat: ripe, abuseipdb: abuse },
  });

  let alert = null;
  if (created || risk.risk_score >= 60) {
    alert = await createAlert(orgId, {
      asset,
      severity: risk.risk_score >= 75 ? 'CRITICAL' : risk.risk_score >= 50 ? 'HIGH' : 'MEDIUM',
      title: `TI scan: ${ip} — abuse score ${abuse.abuse_score ?? 'N/A'}`,
      description: buildInsightsSummary('ip', ip, enrichment),
    });
  }

  return { asset, alert, created };
}

export async function ingestDomainScan(orgId, domain, enrichment) {
  const assets = [];
  const alerts = [];

  const hostRisk = enrichment.openphish?.is_phishing || enrichment.phishtank?.in_database
    ? { risk_level: 'critical', risk_score: 88 }
    : { risk_level: 'medium', risk_score: 45 };

  const main = await upsertAsset(orgId, {
    asset_type: 'domain',
    asset_value: domain,
    ip: '',
    risk_level: hostRisk.risk_level,
    risk_score: hostRisk.risk_score,
    exposure_type: 'public',
    sources: ['TI Scan', 'crt.sh', 'DNS Enum', 'VirusTotal'],
    services: 'Primary domain — passive DNS & cert transparency',
    metadata: { ti_enrichment: enrichment },
  });
  assets.push(main.asset);

  const subdomains = enrichment.crtsh?.subdomains || [];
  for (const sub of subdomains.slice(0, 25)) {
    if (!sub || sub === domain) continue;
    const { asset, created } = await upsertAsset(orgId, {
      asset_type: 'subdomain',
      asset_value: sub,
      risk_level: 'medium',
      risk_score: 50,
      exposure_type: 'public',
      sources: ['crt.sh', 'TI Scan'],
      services: 'Discovered via certificate transparency',
      metadata: { parent_domain: domain },
    });
    assets.push(asset);
    if (created) {
      alerts.push(await createAlert(orgId, {
        asset,
        severity: 'MEDIUM',
        title: `New subdomain discovered: ${sub}`,
        description: `Found via crt.sh while scanning ${domain}`,
      }));
    }
  }

  if (hostRisk.risk_score >= 70) {
    alerts.push(await createAlert(orgId, {
      asset: main.asset,
      severity: 'HIGH',
      title: `Domain risk elevated: ${domain}`,
      description: buildInsightsSummary('domain', domain, enrichment),
    }));
  }

  return { assets, alerts, primary: main.asset };
}

export async function ingestEnrichment(orgId, target, enrichment) {
  const type = enrichment.type || detectTargetType(target);
  const normalized = normalizeTarget(target);

  if (type === 'ip') {
    return { type, target: normalized, ...(await ingestIpScan(orgId, normalized, enrichment)) };
  }
  if (type === 'domain') {
    const result = await ingestDomainScan(orgId, normalized, enrichment);
    return { type, target: normalized, ...result };
  }
  return { type, target: normalized, asset: null };
}

export function summarizeForClient(type, target, enrichment) {
  return {
    target,
    type,
    summary: buildInsightsSummary(type, target, enrichment),
    abuseipdb: enrichment.abuseipdb || null,
    ripestat: enrichment.ripestat || null,
    virustotal: enrichment.virustotal || null,
    alienvault: enrichment.alienvault || null,
    crtsh: enrichment.crtsh ? { total_certs: enrichment.crtsh.total_certs, subdomain_count: enrichment.crtsh.subdomains?.length || 0 } : null,
    criminalip: enrichment.criminalip || null,
    zoomeye: enrichment.zoomeye || null,
    enriched_at: enrichment.enriched_at || new Date().toISOString(),
  };
}

export default { ingestEnrichment, ingestIpScan, ingestDomainScan, summarizeForClient };
