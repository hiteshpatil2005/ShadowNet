/**
 * ShadowNet AI — Universal Investigation Search
 * Supports: IP, Domain, URL, Hash (MD5/SHA1/SHA256), CVE, Email
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Investigation from '../models/Investigation.js';
import tiOrchestrator from '../services/ti/index.js';
import { ingestEnrichment, summarizeForClient } from '../services/scanIngestion.js';
import { detectTargetType, normalizeTarget, detectHashType, getTypeLabel } from '../utils/targetDetect.js';

const router = Router();

/**
 * GET /api/search/investigate?q=<indicator>
 * Universal investigation endpoint — detects type automatically.
 */
router.get('/investigate', authenticate, async (req, res, next) => {
  try {
    const raw = req.query.q?.trim();
    if (!raw) return res.status(400).json({ status: 'error', message: 'Query parameter q is required.' });

    const type = detectTargetType(raw);
    if (type === 'unknown') {
      return res.status(400).json({
        status: 'error',
        message: 'Unrecognized indicator. Enter an IPv4 address, domain, URL, MD5/SHA1/SHA256 hash, CVE ID (CVE-XXXX-XXXXX), or email address.',
        detected_type: type,
      });
    }

    const q = normalizeTarget(raw);
    const orgId = req.organizationId;

    // ─── Route to the correct TI handler ─────────────────────────────────
    let enrichment = null;
    let ingested = null;
    let dbMatches = { assets: [], credentials: [], investigations: [] };

    if (type === 'ip') {
      enrichment = await tiOrchestrator.enrichIP(q);
      ingested = await ingestEnrichment(orgId, q, enrichment).catch(() => null);
      dbMatches.assets = await DigitalAsset.find({
        organization_id: orgId,
        $or: [{ asset_value: q }, { ip: q }],
      }).limit(20);

    } else if (type === 'domain') {
      enrichment = await tiOrchestrator.enrichDomain(q);
      ingested = await ingestEnrichment(orgId, q, enrichment).catch(() => null);
      dbMatches.assets = await DigitalAsset.find({
        organization_id: orgId,
        $or: [
          { asset_value: q },
          { asset_value: { $regex: q.replace(/\./g, '\\.'), $options: 'i' } },
        ],
      }).limit(30);
      dbMatches.credentials = await LeakedCredential.find({
        organization_id: orgId,
        email: { $regex: q.replace(/\./g, '\\.'), $options: 'i' },
      }).limit(10);

    } else if (type === 'url') {
      enrichment = await tiOrchestrator.checkURL(q);

    } else if (type === 'hash') {
      enrichment = await tiOrchestrator.checkMalware(q);
      enrichment.hash_type = detectHashType(q);

    } else if (type === 'cve') {
      enrichment = await tiOrchestrator.lookupCVE(q);
      // Find assets in DB that mention this CVE in their services or metadata
      dbMatches.assets = await DigitalAsset.find({
        organization_id: orgId,
        $or: [
          { services: { $regex: q, $options: 'i' } },
          { 'metadata.cves': q },
          { tags: q },
        ],
      }).limit(20);

    } else if (type === 'email') {
      enrichment = await tiOrchestrator.checkEmail(q);
      dbMatches.credentials = await LeakedCredential.find({
        organization_id: orgId,
        email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      }).limit(20);

      // Auto-ingest email as a leaked credential if AlienVault found pulses
      if (enrichment?.alienvault?.pulse_count > 0) {
        const existing = await LeakedCredential.findOne({ organization_id: orgId, email: q });
        if (!existing) {
          await LeakedCredential.create({
            organization_id: orgId,
            email: q,
            source: 'AlienVault OTX',
            breach_name: `TI Investigation — ${enrichment.alienvault.pulse_count} pulses found`,
            leak_date: new Date().toISOString().split('T')[0],
            severity: enrichment.alienvault.pulse_count >= 5 ? 'CRITICAL' : 'HIGH',
            hash_type: 'unknown',
            credential_type: 'email',
            exposure_count: enrichment.alienvault.pulse_count,
          });
        }
      }
    }

    // ─── Compute risk score and verdict ───────────────────────────────────
    const riskScore = enrichment ? tiOrchestrator.computeRiskScore(type, enrichment) : 0;
    const verdict = enrichment ? tiOrchestrator.computeVerdict(riskScore, type, enrichment) : 'unknown';

    // ─── Store investigation in DB ────────────────────────────────────────
    const activeSources = enrichment
      ? Object.entries(enrichment)
          .filter(([k, v]) => !['type', 'enriched_at', 'hash_type', '_from_cache', 'ip', 'domain', 'url', 'hash', 'email', 'cve_id'].includes(k) && v !== null)
          .map(([k]) => k)
      : [];

    const investigation = await Investigation.findOneAndUpdate(
      { organization_id: orgId, indicator: q, indicator_type: type },
      {
        organization_id: orgId,
        indicator: q,
        indicator_type: type,
        hash_type: type === 'hash' ? detectHashType(q) : null,
        verdict,
        risk_score: riskScore,
        sources: {
          virustotal: enrichment?.virustotal || null,
          abuseipdb: enrichment?.abuseipdb || null,
          alienvault: enrichment?.alienvault || null,
          criminalip: enrichment?.criminalip || null,
          hybridanalysis: enrichment?.hybridanalysis || null,
          urlscan: enrichment?.urlscan || null,
          nvd: enrichment?.nvd || null,
          ripestat: enrichment?.ripestat || null,
          crtsh: enrichment?.crtsh || null,
          dnsenum: enrichment?.dnsenum || null,
          openphish: enrichment?.openphish || null,
          phishtank: enrichment?.phishtank || null,
          abusech: enrichment?.abusech || null,
          zoomeye: enrichment?.zoomeye || null,
          viewdns: enrichment?.viewdns || null,
        },
        active_sources: activeSources,
        linked_asset_id: ingested?.asset?._id || null,
        investigated_at: new Date(),
        cached_until: new Date(Date.now() + 30 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // ─── Build summary for quick display ─────────────────────────────────
    const summary = buildSummary(type, q, enrichment, riskScore, verdict);

    res.json({
      status: 'success',
      data: {
        investigation_id: investigation._id,
        indicator: q,
        indicator_type: type,
        type_label: getTypeLabel(type),
        verdict,
        risk_score: riskScore,
        active_sources: activeSources,
        summary,
        enrichment,
        ingested,
        db_matches: dbMatches,
        investigated_at: investigation.investigated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/search/history
 * Returns recent investigations for this org.
 */
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const query = { organization_id: req.organizationId };
    if (type) query.indicator_type = type;

    const investigations = await Investigation.find(query)
      .sort({ investigated_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Investigation.countDocuments(query);

    res.json({
      status: 'success',
      data: investigations,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) { next(error); }
});

function buildSummary(type, indicator, enrichment, riskScore, verdict) {
  if (!enrichment) return `No intelligence data available for ${indicator}.`;

  const lines = [];

  if (type === 'ip') {
    const abuse = enrichment.abuseipdb;
    const ripe = enrichment.ripestat;
    const vt = enrichment.virustotal;
    const av = enrichment.alienvault;
    if (abuse) lines.push(`AbuseIPDB: ${abuse.abuse_score}% abuse score, ${abuse.total_reports} reports. ISP: ${abuse.isp || '—'}, Country: ${abuse.country || '—'}`);
    if (ripe) lines.push(`Network: ${ripe.holder || '—'} (${ripe.asn || '—'}), ${ripe.country || '—'}`);
    if (vt) lines.push(`VirusTotal: ${vt.malicious || 0}/${vt.total || '?'} engines flagged malicious`);
    if (av?.pulse_count) lines.push(`AlienVault OTX: ${av.pulse_count} threat pulses`);
  } else if (type === 'domain') {
    const crt = enrichment.crtsh;
    const vt = enrichment.virustotal;
    const av = enrichment.alienvault;
    const dns = enrichment.dnsenum;
    if (crt?.subdomains?.length) lines.push(`crt.sh: ${crt.subdomains.length} certificate-derived hostnames`);
    if (dns?.subdomains?.length) lines.push(`DNS Enumeration: ${dns.subdomains.length} live subdomains resolved`);
    if (vt) lines.push(`VirusTotal: ${vt.malicious || 0}/${vt.total || '?'} detections. Registrar: ${vt.registrar || '—'}`);
    if (av?.pulse_count) lines.push(`AlienVault OTX: ${av.pulse_count} threat pulses`);
    if (enrichment.openphish?.is_phishing) lines.push('⚠️ PHISHING: Found in OpenPhish feed');
    if (enrichment.phishtank?.is_phish) lines.push('⚠️ PHISHING: Verified in PhishTank database');
  } else if (type === 'hash') {
    const vt = enrichment.virustotal;
    const ha = enrichment.hybridanalysis;
    if (vt) lines.push(`VirusTotal: ${vt.malicious || 0}/${vt.total || '?'} detections. Name: ${vt.meaningful_name || '—'}`);
    if (vt?.popular_threat_name) lines.push(`Malware family: ${vt.popular_threat_name}`);
    if (ha?.results?.[0]) lines.push(`Hybrid Analysis: ${ha.results[0].verdict || '—'} (threat score: ${ha.results[0].threat_score || '—'})`);
  } else if (type === 'cve') {
    const nvd = enrichment.nvd;
    if (nvd?.found) {
      lines.push(`CVE: ${nvd.cve_id} — ${nvd.severity || 'N/A'} (CVSS: ${nvd.cvss_score ?? 'N/A'})`);
      lines.push(`Published: ${nvd.published ? new Date(nvd.published).toLocaleDateString() : '—'}`);
      if (nvd.description) lines.push(nvd.description.slice(0, 300));
    } else {
      lines.push(`CVE ${indicator}: No NVD record found.`);
    }
  } else if (type === 'email') {
    const av = enrichment.alienvault;
    if (av?.pulse_count > 0) lines.push(`AlienVault OTX: ${av.pulse_count} threat pulses referencing this email`);
    else lines.push('No breach intelligence found via available APIs for this email.');
  } else if (type === 'url') {
    if (enrichment.openphish?.is_phishing) lines.push('⚠️ PHISHING: Found in OpenPhish feed');
    if (enrichment.phishtank?.is_phish) lines.push('⚠️ PHISHING: Verified in PhishTank database');
    if (enrichment.urlscan?.total) lines.push(`URLScan: ${enrichment.urlscan.total} scan results found`);
  }

  if (lines.length === 0) {
    return `Investigation complete for ${indicator}. Risk score: ${riskScore}/100. Verdict: ${verdict.toUpperCase()}. Some APIs may require keys for full results.`;
  }

  return `[${verdict.toUpperCase()} — Risk: ${riskScore}/100]\n${lines.join('\n')}`;
}

export default router;
