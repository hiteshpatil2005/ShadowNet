import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class AbuseIPDBAdapter extends BaseAdapter {
  constructor() { super('abuseipdb', env.ABUSEIPDB_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = { Key: this.apiKey, Accept: 'application/json' };
    const data = await this.httpGet(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(target)}&maxAgeInDays=90&verbose`, headers);
    return this.normalize(data);
  }

  normalize(data) {
    const d = data?.data || {};
    return { ip: d.ipAddress, abuse_score: d.abuseConfidenceScore || 0, total_reports: d.totalReports || 0, country: d.countryCode || '', isp: d.isp || '', usage_type: d.usageType || '', domain: d.domain || '', is_public: d.isPublic, is_tor: d.isTor, last_reported: d.lastReportedAt };
  }

  getFallback(target) { return null; }
}
