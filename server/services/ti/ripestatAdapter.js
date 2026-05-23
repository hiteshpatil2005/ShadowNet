import BaseAdapter from './baseAdapter.js';

/**
 * RIPEstat Data API — free, no API key for basic lookups.
 * https://stat.ripe.net/docs/data_api
 */
export default class RipestatAdapter extends BaseAdapter {
  constructor() {
    super('ripestat', '');
  }

  isFreeNoKey() {
    return true;
  }

  async fetchFromAPI(target, queryType) {
    const resource = target.replace(/^https?:\/\//, '').split('/')[0];

    if (queryType === 'routing') {
      const data = await this.httpGet(
        `https://stat.ripe.net/data/routing-status/data.json?resource=${encodeURIComponent(resource)}`
      );
      return this.normalizeRouting(data, resource);
    }

    if (queryType === 'asn') {
      const data = await this.httpGet(
        `https://stat.ripe.net/data/as-overview/data.json?resource=AS${encodeURIComponent(resource.replace(/^AS/i, ''))}`
      );
      return this.normalizeAsn(data, resource);
    }

    const [whois, geoloc, prefixes] = await Promise.allSettled([
      this.httpGet(`https://stat.ripe.net/data/whois/data.json?resource=${encodeURIComponent(resource)}`),
      this.httpGet(`https://stat.ripe.net/data/geoloc/data.json?resource=${encodeURIComponent(resource)}`),
      this.httpGet(`https://stat.ripe.net/data/prefix-overview/data.json?resource=${encodeURIComponent(resource)}`),
    ]);

    return this.normalizeWhois(
      resource,
      whois.status === 'fulfilled' ? whois.value : null,
      geoloc.status === 'fulfilled' ? geoloc.value : null,
      prefixes.status === 'fulfilled' ? prefixes.value : null
    );
  }

  normalizeWhois(resource, whois, geoloc, prefixes) {
    const records = whois?.data?.records || [];
    const firstRecord = records[0]?.[0] || [];
    const getField = (name) => firstRecord.find(r => r.key === name || r.name === name)?.value || '';

    const locations = geoloc?.data?.locations || [];
    const loc = locations[0] || {};

    const prefixList = prefixes?.data?.prefixes || prefixes?.data?.resource?.prefixes || [];

    return {
      resource,
      holder: getField('org-name') || getField('descr') || '',
      country: getField('country') || loc.country || '',
      asn: getField('origin') || (prefixList[0]?.asn ? `AS${prefixList[0].asn}` : ''),
      inetnum: getField('inetnum') || getField('inet6num') || '',
      abuse_contact: getField('abuse-mailbox') || '',
      city: loc.city || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      prefix_count: Array.isArray(prefixList) ? prefixList.length : 0,
      prefixes: (Array.isArray(prefixList) ? prefixList : []).slice(0, 5).map(p => p.prefix || p),
    };
  }

  normalizeRouting(data, resource) {
    const routes = data?.data?.routes || [];
    return {
      resource,
      route_count: routes.length,
      routes: routes.slice(0, 10).map(r => ({
        prefix: r.prefix,
        origin: r.origin,
        peer_count: r.peer_count,
      })),
    };
  }

  normalizeAsn(data, resource) {
    const block = data?.data?.resource || data?.data || {};
    return {
      asn: block.holder || resource,
      name: block.holder || '',
      announced: block.announced,
      block: block.block || {},
    };
  }

  getFallback(target) {
    return {
      _source: 'ripestat',
      _fallback: true,
      resource: target,
      holder: '',
      country: '',
      asn: '',
      inetnum: '',
      abuse_contact: '',
      prefix_count: 0,
      prefixes: [],
    };
  }
}
