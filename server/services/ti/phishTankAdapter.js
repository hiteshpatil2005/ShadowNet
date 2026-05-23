import BaseAdapter from './baseAdapter.js';

export default class PhishTankAdapter extends BaseAdapter {
  constructor() { super('phishtank', ''); }
  isFreeNoKey() { return true; }

  async fetchFromAPI(target, queryType) {
    try {
      const data = await this.httpPost('https://checkurl.phishtank.com/checkurl/', `url=${encodeURIComponent(target)}&format=json&app_key=`, { 'Content-Type': 'application/x-www-form-urlencoded' });
      return { url: target, in_database: data?.results?.in_database || false, is_phish: data?.results?.valid || false, phish_id: data?.results?.phish_id || null, verified: data?.results?.verified || false };
    } catch {
      return this.getFallback(target);
    }
  }

  getFallback(target) {
    return { _source: 'phishtank', _fallback: true, target, in_database: false, is_phish: false, phish_id: null };
  }
}
