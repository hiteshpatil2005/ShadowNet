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

  async lookupCVE(cveId) {
    return this.adapters.nvd.query(cveId, 'default');
  }

  async searchCVE(keyword) {
    return this.adapters.nvd.query(keyword, 'keyword');
  }

  async enrichIP(ip) {
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
      alienvault: alienvault.status === 'fulfilled' ? alienvault.value : null,
      abuseipdb: abuseipdb.status === 'fulfilled' ? abuseipdb.value : null,
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      criminalip: criminalip.status === 'fulfilled' ? criminalip.value : null,
      zoomeye: zoomeye.status === 'fulfilled' ? zoomeye.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      ripestat: ripestat.status === 'fulfilled' ? ripestat.value : null,
      enriched_at: new Date().toISOString(),
    };

    // Persist to MongoDB cache
    await this.persistCache('ip', ip, result).catch(() => {});
    return result;
  }

  async enrichDomain(domain) {
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

    await this.persistCache('domain', domain, result).catch(() => {});
    return result;
  }

  async checkCredential(email) {
    const [alienvault] = await Promise.allSettled([
      this.adapters.alienvault.query(email, 'email'),
    ]);

    return {
      email,
      alienvault: alienvault.status === 'fulfilled' ? alienvault.value : null,
      enriched_at: new Date().toISOString(),
    };
  }

  async checkURL(url) {
    const [urlscan, openphish, phishtank, virustotal, abusech] = await Promise.allSettled([
      this.adapters.urlscan.query(url, 'search'),
      this.adapters.openphish.query(url, 'check'),
      this.adapters.phishtank.query(url, 'check'),
      this.adapters.virustotal.query(url, 'url'),
      this.adapters.abusech.query(url, 'url'),
    ]);

    return {
      url,
      urlscan: urlscan.status === 'fulfilled' ? urlscan.value : null,
      openphish: openphish.status === 'fulfilled' ? openphish.value : null,
      phishtank: phishtank.status === 'fulfilled' ? phishtank.value : null,
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      enriched_at: new Date().toISOString(),
    };
  }

  async checkMalware(hash) {
    const [virustotal, hybridanalysis, abusech] = await Promise.allSettled([
      this.adapters.virustotal.query(hash, 'file'),
      this.adapters.hybridanalysis.query(hash, 'hash'),
      this.adapters.abusech.query(hash, 'hash'),
    ]);

    return {
      hash,
      virustotal: virustotal.status === 'fulfilled' ? virustotal.value : null,
      hybridanalysis: hybridanalysis.status === 'fulfilled' ? hybridanalysis.value : null,
      abusech: abusech.status === 'fulfilled' ? abusech.value : null,
      enriched_at: new Date().toISOString(),
    };
  }

  async fullScan(targets) {
    const results = [];
    for (const target of targets) {
      const type = this.detectTargetType(target);
      let enrichment;
      if (type === 'ip') enrichment = await this.enrichIP(target);
      else if (type === 'email') enrichment = await this.checkCredential(target);
      else if (type === 'url') enrichment = await this.checkURL(target);
      else enrichment = await this.enrichDomain(target);
      results.push({ target, type, ...enrichment });
    }
    return results;
  }

  detectTargetType(target) {
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target)) return 'ip';
    if (target.includes('@')) return 'email';
    if (target.startsWith('http://') || target.startsWith('https://')) return 'url';
    return 'domain';
  }

  async persistCache(queryType, queryValue, result) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await TICache.findOneAndUpdate(
      { query_type: queryType, query_value: queryValue, source: 'orchestrator' },
      { result, cached_at: new Date(), expires_at: expiresAt, $inc: { hit_count: 1 } },
      { upsert: true }
    );
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
