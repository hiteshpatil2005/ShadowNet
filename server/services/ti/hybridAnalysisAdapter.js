import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class HybridAnalysisAdapter extends BaseAdapter {
  constructor() { super('hybridanalysis', env.HYBRID_ANALYSIS_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = { 'api-key': this.apiKey, 'User-Agent': 'Falcon Sandbox', Accept: 'application/json' };
    if (queryType === 'hash') {
      const data = await this.httpPost('https://www.hybrid-analysis.com/api/v2/search/hash', `hash=${target}`, { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' });
      return this.normalize(data);
    }
    const data = await this.httpPost('https://www.hybrid-analysis.com/api/v2/search/terms', `domain=${encodeURIComponent(target)}`, { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' });
    return { count: data?.count || 0, results: (data?.result || []).slice(0, 10).map(r => ({ sha256: r.sha256, verdict: r.verdict, threat_score: r.threat_score, type: r.type, environment: r.environment_description })) };
  }

  normalize(data) {
    const items = Array.isArray(data) ? data : [data];
    return { results: items.slice(0, 5).map(r => ({ sha256: r?.sha256, verdict: r?.verdict, threat_score: r?.threat_score, malware_family: r?.vx_family, type: r?.type, size: r?.size })) };
  }

  getFallback(target) { return null; }
}
