import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class AlienVaultAdapter extends BaseAdapter {
  constructor() { super('alienvault', env.ALIENVAULT_OTX_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = this.apiKey ? { 'X-OTX-API-KEY': this.apiKey } : {};
    if (queryType === 'ip') {
      const general = await this.httpGet(`https://otx.alienvault.com/api/v1/indicators/IPv4/${target}/general`, headers);
      const reputation = await this.httpGet(`https://otx.alienvault.com/api/v1/indicators/IPv4/${target}/reputation`, headers).catch(() => ({}));
      return { pulse_count: general?.pulse_info?.count || 0, pulses: (general?.pulse_info?.pulses || []).slice(0, 5).map(p => ({ name: p.name, description: p.description, created: p.created })), reputation: reputation?.reputation || null, country: general?.country_code || '', asn: general?.asn || '' };
    }
    if (queryType === 'domain') {
      const general = await this.httpGet(`https://otx.alienvault.com/api/v1/indicators/domain/${target}/general`, headers);
      return { pulse_count: general?.pulse_info?.count || 0, pulses: (general?.pulse_info?.pulses || []).slice(0, 5).map(p => ({ name: p.name, description: p.description })), whois: general?.whois || '', alexa: general?.alexa || '' };
    }
    // email/breach check
    const data = await this.httpGet(`https://otx.alienvault.com/api/v1/indicators/email/${target}/general`, headers).catch(() => null);
    return { pulse_count: data?.pulse_info?.count || 0, pulses: (data?.pulse_info?.pulses || []).slice(0, 5) };
  }

  isFreeNoKey() { return true; } // OTX works without key (limited)

  getFallback(target) { return null; }
}
