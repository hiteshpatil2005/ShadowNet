import BaseAdapter from './baseAdapter.js';

export default class AbuseChAdapter extends BaseAdapter {
  constructor() { super('abusech', ''); }
  isFreeNoKey() { return true; }

  async fetchFromAPI(target, queryType) {
    if (queryType === 'url') {
      const data = await this.httpPost('https://urlhaus-api.abuse.ch/v1/url/', `url=${encodeURIComponent(target)}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
      return { query_status: data?.query_status, threat: data?.threat || '', tags: data?.tags || [], urls: (data?.urls || []).slice(0, 5) };
    }
    if (queryType === 'host') {
      const data = await this.httpPost('https://urlhaus-api.abuse.ch/v1/host/', `host=${encodeURIComponent(target)}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
      return { url_count: data?.url_count || 0, urls: (data?.urls || []).slice(0, 10).map(u => ({ url: u.url, status: u.url_status, threat: u.threat, date_added: u.date_added })) };
    }
    // hash lookup via MalwareBazaar
    const data = await this.httpPost('https://mb-api.abuse.ch/api/v1/', `query=get_info&hash=${target}`, { 'Content-Type': 'application/x-www-form-urlencoded' });
    return { query_status: data?.query_status, data: data?.data?.[0] || null };
  }

  getFallback(target) { return null; }
}
