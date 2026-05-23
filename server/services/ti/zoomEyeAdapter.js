import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class ZoomEyeAdapter extends BaseAdapter {
  constructor() { super('zoomeye', env.ZOOMEYE_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = { 'API-KEY': this.apiKey };
    if (queryType === 'host') {
      const data = await this.httpGet(`https://api.zoomeye.org/host/search?query=ip:${encodeURIComponent(target)}`, headers);
      return this.normalizeHost(data);
    }
    const data = await this.httpGet(`https://api.zoomeye.org/host/search?query=hostname:${encodeURIComponent(target)}`, headers);
    return { total: data?.total || 0, matches: (data?.matches || []).slice(0, 20).map(m => ({ ip: m.ip, port: m.portinfo?.port, service: m.portinfo?.service, banner: m.portinfo?.banner?.slice(0, 200), os: m.portinfo?.os, app: m.portinfo?.app })) };
  }

  normalizeHost(data) {
    const matches = data?.matches || [];
    return { total: data?.total || 0, services: matches.map(m => ({ ip: m.ip, port: m.portinfo?.port, service: m.portinfo?.service, banner: m.portinfo?.banner?.slice(0, 200), os: m.portinfo?.os })) };
  }

  getFallback(target) {
    return { _source: 'zoomeye', _fallback: true, target, total: 2, matches: [{ ip: target, port: 443, service: 'https', banner: '', os: 'Linux', app: 'nginx' }, { ip: target, port: 22, service: 'ssh', banner: 'SSH-2.0-OpenSSH_8.9', os: 'Linux' }] };
  }
}
