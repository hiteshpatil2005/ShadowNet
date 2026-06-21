import BaseAdapter from './baseAdapter.js';

export default class OpenPhishAdapter extends BaseAdapter {
  constructor() { super('openphish', ''); }
  isFreeNoKey() { return true; }

  async fetchFromAPI(target, queryType) {
    const feedText = await this.httpGet('https://openphish.com/feed.txt');
    const urls = (feedText || '').split('\n').filter(u => u.trim());
    const matches = urls.filter(u => u.toLowerCase().includes(target.toLowerCase()));
    return { total_feed: urls.length, matches: matches.slice(0, 20), is_phishing: matches.length > 0 };
  }

  getFallback(target) { return null; }
}
