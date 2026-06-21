/**
 * ShadowNet AI — TI Orchestrator
 * Routes investigations to the correct adapters.
 * Cache TTL: 30 minutes.
 * All results are real API data — null sources mean that adapter had no data.
 */
import VirusTotalAdapter from './virusTotalAdapter.js';
import CriminalIPAdapter from './criminalIPAdapter.js';
import AbuseIPDBAdapter from './abuseIPDBAdapter.js';
import AlienVaultAdapter from './alienVaultAdapter.js';
import AbuseChAdapter from './abuseChAdapter.js';
import CrtShAdapter from './crtShAdapter.js';
import ViewDnsAdapter from './viewDnsAdapter.js';
import DnsEnumAdapter from './dnsEnumAdapter.js';
import ZoomEyeAdapter from './zoomEyeAdapter.js';
import UrlScanAdapter from './urlScanAdapter.js';
import OpenPhishAdapter from './openPhishAdapter.js';
import PhishTankAdapter from './phishTankAdapter.js';
import HybridAnalysisAdapter from './hybridAnalysisAdapter.js';
import NvdAdapter from './nvdAdapter.js';
import RipestatAdapter from './ripestatAdapter.js';
import TICache from '../../models/TICache.js';

// 30 minutes cache TTL
const CACHE_TTL_MS = 30 * 60 * 1000;

class TIOrchestrator {
  constructor() {
    this.adapters = {
      virustotal: new VirusTotalAdapter(),
      criminalip: new CriminalIPAdapter(),
      abuseipdb: new AbuseIPDBAdapter(),
      alienvault: new AlienVaultAdapter(),
      abusech: new AbuseChAdapter(),
      crtsh: new CrtShAdapter(),
      viewdns: new ViewDnsAdapter(),
      dnsenum: new DnsEnumAdapter(),
      zoomeye: new ZoomEyeAdapter(),
      urlscan: new UrlScanAdapter(),
      openphish: new OpenPhishAdapter(),
      phishtank: new PhishTankAdapter(),
      hybridanalysis: new HybridAnalysisAdapter(),
      nvd: new NvdAdapter(),
      ripestat: new RipestatAdapter(),
    };
  }

  // ─── Cached DB lookup ────────────────────────────────────────────────────
  async getCachedResult(type, value) {
    try {
      const cached = await TICache.findOne({
        query_type: type,
        query_value: value,
        source: 'orchestrator',
        expires_at: { $gt: new Date() },
      });
      return cached?.result || null;
    } catch { return null; }
  }

  async persistCache(queryType, queryValue, result) {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    try {
      await TICache.findOneAndUpdate(
        { query_type: queryType, query_value: queryValue, source: 'orchestrator' },
        { result, cached_at: new Date(), expires_at: expiresAt, $inc: { hit_count: 1 } },
        { upsert: true }
      );
    } catch { /* cache write failure is non-fatal */ }
  }

  // ─── IP Investigation ───────────────────────────────────────────────────
  async enrichIP(ip) {
    const cached = await this.getCachedResult('ip', ip);
    if (cached) return { ...cached, _from_cache: true };

    const [alienvault, abuseipdb, virustotal, criminalip, zoomeye, abusech, ripestat] = await Promise.allSettled([
      this.adapters.alienvault.query(ip, 'ip'),
      this.adapters.abuseipdb.query(ip, 'ip'),
      this.adapters.virustotal.query(ip, 'ip'),
      this.adapters.criminalip.query(ip, 'host'),
      this.adapters.zoomeye.query(ip, 'host'),
      this.adapters.abusech.query(ip, 'host'),
      this.adapters.ripestat.query(ip, 'whois'),
    ]);

    const result = {
      ip,
      type: 'ip',
      alienvault: alienvault.status === 'fulfilled' ? alienvault.value : null,
      abuseipdb: abuseipdb.status === 'fulfilled' ? abuseipdb.value : null,
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      criminalip: criminalip.status === 'fulfilled' ? criminalip.value : null,
      zoomeye: zoomeye.status === 'fulfilled' ? zoomeye.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      ripestat: ripestat.status === 'fulfilled' ? ripestat.value : null,
      enriched_at: new Date().toISOString(),
    };

    await this.persistCache('ip', ip, result);
    return result;
  }

  // ─── Domain Investigation ────────────────────────────────────────────────
  async enrichDomain(domain) {
    const cached = await this.getCachedResult('domain', domain);
    if (cached) return { ...cached, _from_cache: true };

    const [alienvault, virustotal, urlscan, crtsh, viewdns, dnsenum, openphish, phishtank, abusech, ripestat] = await Promise.allSettled([
      this.adapters.alienvault.query(domain, 'domain'),
      this.adapters.virustotal.query(domain, 'domain'),
      this.adapters.urlscan.query(domain, 'search'),
      this.adapters.crtsh.query(domain, 'certs'),
      this.adapters.viewdns.query(domain, 'subdomains'),
      this.adapters.dnsenum.query(domain, 'enum'),
      this.adapters.openphish.query(domain, 'check'),
      this.adapters.phishtank.query(domain, 'check'),
      this.adapters.abusech.query(domain, 'host'),
      this.adapters.ripestat.query(domain, 'whois'),
    ]);

    const result = {
      domain,
      type: 'domain',
      alienvault: alienvault.status === 'fulfilled' ? alienvault.value : null,
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      urlscan: urlscan.status === 'fulfilled' ? urlscan.value : null,
      crtsh: crtsh.status === 'fulfilled' ? crtsh.value : null,
      viewdns: viewdns.status === 'fulfilled' ? viewdns.value : null,
      dnsenum: dnsenum.status === 'fulfilled' ? dnsenum.value : null,
      openphish: openphish.status === 'fulfilled' ? openphish.value : null,
      phishtank: phishtank.status === 'fulfilled' ? phishtank.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      ripestat: ripestat.status === 'fulfilled' ? ripestat.value : null,
      enriched_at: new Date().toISOString(),
    };

    await this.persistCache('domain', domain, result);
    return result;
  }

  // ─── URL Investigation ───────────────────────────────────────────────────
  async checkURL(url) {
    const cached = await this.getCachedResult('url', url);
    if (cached) return { ...cached, _from_cache: true };

    const [urlscan, openphish, phishtank, virustotal, abusech] = await Promise.allSettled([
      this.adapters.urlscan.query(url, 'search'),
      this.adapters.openphish.query(url, 'check'),
      this.adapters.phishtank.query(url, 'check'),
      this.adapters.virustotal.query(url, 'url'),
      this.adapters.abusech.query(url, 'url'),
    ]);

    const result = {
      url,
      type: 'url',
      urlscan: urlscan.status === 'fulfilled' ? urlscan.value : null,
      openphish: openphish.status === 'fulfilled' ? openphish.value : null,
      phishtank: phishtank.status === 'fulfilled' ? phishtank.value : null,
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      enriched_at: new Date().toISOString(),
    };

    await this.persistCache('url', url, result);
    return result;
  }

  // ─── File Hash Investigation ─────────────────────────────────────────────
  async checkMalware(hash) {
    const cached = await this.getCachedResult('hash', hash);
    if (cached) return { ...cached, _from_cache: true };

    const [virustotal, hybridanalysis, abusech] = await Promise.allSettled([
      this.adapters.virustotal.query(hash, 'file'),
      this.adapters.hybridanalysis.query(hash, 'hash'),
      this.adapters.abusech.query(hash, 'hash'),
    ]);

    const result = {
      hash,
      type: 'hash',
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      hybridanalysis: hybridanalysis.status === 'fulfilled' ? hybridanalysis.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      enriched_at: new Date().toISOString(),
    };

    await this.persistCache('hash', hash, result);
    return result;
  }

  // ─── CVE Investigation ───────────────────────────────────────────────────
  async lookupCVE(cveId) {
    const cached = await this.getCachedResult('cve', cveId);
    if (cached) return { ...cached, _from_cache: true };

    const result = await this.adapters.nvd.query(cveId, 'default');
    const wrapped = {
      cve_id: cveId,
      type: 'cve',
      nvd: result,
      enriched_at: new Date().toISOString(),
    };

    if (result) await this.persistCache('cve', cveId, wrapped);
    return wrapped;
  }

  async searchCVE(keyword) {
    return this.adapters.nvd.query(keyword, 'keyword');
  }

  // ─── Email Investigation ─────────────────────────────────────────────────
  async checkEmail(email) {
    const cached = await this.getCachedResult('email', email);
    if (cached) return { ...cached, _from_cache: true };

    const [alienvault] = await Promise.allSettled([
      this.adapters.alienvault.query(email, 'email'),
    ]);

    const result = {
      email,
      type: 'email',
      alienvault: alienvault.status === 'fulfilled' ? alienvault.value : null,
      enriched_at: new Date().toISOString(),
    };

    await this.persistCache('email', email, result);
    return result;
  }

  // ─── Credential check (alias) ────────────────────────────────────────────
  async checkCredential(email) {
    return this.checkEmail(email);
  }

  // ─── Full Scan (batch) ───────────────────────────────────────────────────
  async fullScan(targets) {
    const results = [];
    for (const target of targets) {
      const type = this.detectTargetType(target);
      let enrichment;
      if (type === 'ip') enrichment = await this.enrichIP(target);
      else if (type === 'email') enrichment = await this.checkEmail(target);
      else if (type === 'url') enrichment = await this.checkURL(target);
      else if (type === 'hash') enrichment = await this.checkMalware(target);
      else if (type === 'cve') enrichment = await this.lookupCVE(target);
      else enrichment = await this.enrichDomain(target);
      results.push({ target, type, ...enrichment });
    }
    return results;
  }

  detectTargetType(target) {
    // Import inline to avoid circular deps
    const t = String(target || '').trim();
    if (/^CVE-\d{4}-\d{4,}$/i.test(t)) return 'cve';
    if (/^[a-f0-9]{32}$/i.test(t) || /^[a-f0-9]{40}$/i.test(t) || /^[a-f0-9]{64}$/i.test(t)) return 'hash';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) return 'ip';
    if (t.includes('@')) return 'email';
    if (t.startsWith('http://') || t.startsWith('https://')) return 'url';
    return 'domain';
  }

  // ─── Compute overall risk score from multi-source results ────────────────
  computeRiskScore(type, enrichment) {
    let score = 0;
    let factors = 0;

    if (type === 'ip') {
      if (enrichment.abuseipdb?.abuse_score != null) {
        score += enrichment.abuseipdb.abuse_score;
        factors++;
      }
      if (enrichment.virustotal?.malicious != null) {
        const vtScore = Math.min(100, (enrichment.virustotal.malicious / Math.max(enrichment.virustotal.total, 1)) * 100);
        score += vtScore;
        factors++;
      }
      if (enrichment.alienvault?.pulse_count > 0) {
        score += Math.min(100, enrichment.alienvault.pulse_count * 10);
        factors++;
      }
    } else if (type === 'domain') {
      if (enrichment.virustotal?.malicious > 0) {
        score += Math.min(100, (enrichment.virustotal.malicious / Math.max(enrichment.virustotal.total, 1)) * 100);
        factors++;
      }
      if (enrichment.openphish?.is_phishing || enrichment.phishtank?.is_phish) {
        score += 90;
        factors++;
      }
      if (enrichment.alienvault?.pulse_count > 0) {
        score += Math.min(80, enrichment.alienvault.pulse_count * 5);
        factors++;
      }
    } else if (type === 'hash') {
      if (enrichment.virustotal?.malicious != null) {
        score += Math.min(100, (enrichment.virustotal.malicious / Math.max(enrichment.virustotal.total, 1)) * 100);
        factors++;
      }
    } else if (type === 'url') {
      if (enrichment.openphish?.is_phishing || enrichment.phishtank?.is_phish) {
        score += 90;
        factors++;
      }
      if (enrichment.virustotal?.stats?.malicious > 0) {
        score += 70;
        factors++;
      }
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  computeVerdict(riskScore, type, enrichment) {
    if (riskScore >= 70) return 'malicious';
    if (riskScore >= 40) return 'suspicious';
    // Check specific definitive signals
    if (type === 'hash' && enrichment.virustotal?.malicious > 0) return 'malicious';
    if (enrichment.openphish?.is_phishing || enrichment.phishtank?.is_phish) return 'malicious';
    if (riskScore > 0) return 'suspicious';
    // If we have real data back and risk is 0, it's clean
    const hasSomeData = Object.values(enrichment).some(v => v !== null && typeof v === 'object' && !['type', 'enriched_at'].includes(v));
    return hasSomeData ? 'clean' : 'unknown';
  }

  getAdapterStatus() {
    return Object.entries(this.adapters).map(([name, adapter]) => ({
      name,
      enabled: adapter.enabled,
      calls: adapter.callCount,
      hasKey: !!adapter.apiKey,
      freeNoKey: adapter.isFreeNoKey(),
    }));
  }
}

const orchestrator = new TIOrchestrator();
export default orchestrator;
