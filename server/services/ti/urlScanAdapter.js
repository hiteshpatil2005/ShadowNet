import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class UrlScanAdapter extends BaseAdapter {
  constructor() { super('urlscan', env.URLSCAN_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = this.apiKey ? { 'API-Key': this.apiKey } : {};
    if (queryType === 'search') {
      const data = await this.httpGet(`https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(target)}&size=10`, headers);
      return { total: data?.total || 0, results: (data?.results || []).slice(0, 10).map(r => ({ url: r.page?.url, domain: r.page?.domain, ip: r.page?.ip, status: r.page?.status, title: r.page?.title, screenshot: r.screenshot, time: r.task?.time })) };
    }
    // submit scan
    const data = await this.httpPost('https://urlscan.io/api/v1/scan/', { url: target, visibility: 'public' }, { ...headers, 'Content-Type': 'application/json' });
    return { uuid: data?.uuid, api: data?.api, visibility: data?.visibility, url: data?.url };
  }

  getFallback(target) {
    return { _source: 'urlscan', _fallback: true, target, total: 1, results: [{ url: `https://${target}`, domain: target, ip: '93.184.216.34', status: 200, title: target, screenshot: null }] };
  }
}
