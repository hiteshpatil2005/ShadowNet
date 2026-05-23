import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class VirusTotalAdapter extends BaseAdapter {
  constructor() { super('virustotal', env.VIRUSTOTAL_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = { 'x-apikey': this.apiKey };
    if (queryType === 'ip') {
      const data = await this.httpGet(`https://www.virustotal.com/api/v3/ip_addresses/${target}`, headers);
      return this.normalizeIP(data);
    }
    if (queryType === 'domain') {
      const data = await this.httpGet(`https://www.virustotal.com/api/v3/domains/${target}`, headers);
      return this.normalizeDomain(data);
    }
    const data = await this.httpGet(`https://www.virustotal.com/api/v3/urls/${Buffer.from(target).toString('base64').replace(/=/g, '')}`, headers);
    return { reputation: data?.data?.attributes?.reputation || 0, stats: data?.data?.attributes?.last_analysis_stats || {} };
  }

  normalizeIP(data) {
    const attrs = data?.data?.attributes || {};
    return { reputation: attrs.reputation || 0, country: attrs.country || 'Unknown', as_owner: attrs.as_owner || '', network: attrs.network || '', last_analysis_stats: attrs.last_analysis_stats || {}, tags: attrs.tags || [] };
  }

  normalizeDomain(data) {
    const attrs = data?.data?.attributes || {};
    return { reputation: attrs.reputation || 0, registrar: attrs.registrar || '', categories: attrs.categories || {}, last_analysis_stats: attrs.last_analysis_stats || {}, dns_records: attrs.last_dns_records || [] };
  }

  getFallback(target, queryType) {
    return { _source: 'virustotal', _fallback: true, target, reputation: -5, last_analysis_stats: { malicious: 2, suspicious: 1, harmless: 65, undetected: 12 }, country: 'US', tags: ['suspicious'], categories: {} };
  }
}
