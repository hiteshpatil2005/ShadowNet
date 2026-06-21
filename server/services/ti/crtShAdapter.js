import BaseAdapter from './baseAdapter.js';

export default class CrtShAdapter extends BaseAdapter {
  constructor() { super('crtsh', ''); }
  isFreeNoKey() { return true; }

  async fetchFromAPI(target, queryType) {
    const data = await this.httpGet(`https://crt.sh/?q=%25.${encodeURIComponent(target)}&output=json`);
    const subdomains = [...new Set((data || []).map(c => c.name_value).flatMap(n => n.split('\n')).filter(n => n.includes(target)))];
    return { total_certs: (data || []).length, subdomains, certificates: (data || []).slice(0, 20).map(c => ({ id: c.id, issuer: c.issuer_name, common_name: c.common_name, name_value: c.name_value, not_before: c.not_before, not_after: c.not_after })) };
  }

  getFallback(target) { return null; }
}
