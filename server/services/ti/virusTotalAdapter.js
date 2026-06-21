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
    if (queryType === 'file') {
      const data = await this.httpGet(`https://www.virustotal.com/api/v3/files/${target}`, headers);
      return this.normalizeFile(data);
    }
    if (queryType === 'url') {
      const encoded = Buffer.from(target).toString('base64').replace(/=/g, '');
      const data = await this.httpGet(`https://www.virustotal.com/api/v3/urls/${encoded}`, headers);
      return { reputation: data?.data?.attributes?.reputation || 0, stats: data?.data?.attributes?.last_analysis_stats || {}, url: target };
    }
    return null;
  }

  normalizeIP(data) {
    const attrs = data?.data?.attributes || {};
    return {
      reputation: attrs.reputation || 0,
      country: attrs.country || null,
      as_owner: attrs.as_owner || null,
      network: attrs.network || null,
      last_analysis_stats: attrs.last_analysis_stats || {},
      malicious: attrs.last_analysis_stats?.malicious || 0,
      total: Object.values(attrs.last_analysis_stats || {}).reduce((s, v) => s + v, 0),
      tags: attrs.tags || [],
    };
  }

  normalizeDomain(data) {
    const attrs = data?.data?.attributes || {};
    return {
      reputation: attrs.reputation || 0,
      registrar: attrs.registrar || null,
      creation_date: attrs.creation_date || null,
      categories: attrs.categories || {},
      last_analysis_stats: attrs.last_analysis_stats || {},
      malicious: attrs.last_analysis_stats?.malicious || 0,
      total: Object.values(attrs.last_analysis_stats || {}).reduce((s, v) => s + v, 0),
      dns_records: attrs.last_dns_records || [],
      whois: attrs.whois || null,
    };
  }

  normalizeFile(data) {
    const attrs = data?.data?.attributes || {};
    return {
      sha256: attrs.sha256 || null,
      md5: attrs.md5 || null,
      sha1: attrs.sha1 || null,
      meaningful_name: attrs.meaningful_name || null,
      type_description: attrs.type_description || null,
      size: attrs.size || null,
      malicious: attrs.last_analysis_stats?.malicious || 0,
      suspicious: attrs.last_analysis_stats?.suspicious || 0,
      harmless: attrs.last_analysis_stats?.harmless || 0,
      undetected: attrs.last_analysis_stats?.undetected || 0,
      total: Object.values(attrs.last_analysis_stats || {}).reduce((s, v) => s + v, 0),
      last_analysis_stats: attrs.last_analysis_stats || {},
      popular_threat_name: attrs.popular_threat_classification?.suggested_threat_label || null,
      first_submission_date: attrs.first_submission_date ? new Date(attrs.first_submission_date * 1000).toISOString() : null,
      last_submission_date: attrs.last_submission_date ? new Date(attrs.last_submission_date * 1000).toISOString() : null,
      tags: attrs.tags || [],
      sandbox_verdicts: attrs.sandbox_verdicts || {},
    };
  }

  getFallback(target, queryType) { return null; }
}
