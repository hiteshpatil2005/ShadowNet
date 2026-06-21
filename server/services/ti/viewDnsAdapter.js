import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class ViewDnsAdapter extends BaseAdapter {
  constructor() { super('viewdns', env.VIEWDNS_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const apiKey = this.apiKey;

    if (queryType === 'subdomains' || queryType === 'dns') {
      // DNS records lookup
      const data = await this.httpGet(`https://api.viewdns.info/dnsrecord/?domain=${encodeURIComponent(target)}&recordtype=ANY&apikey=${apiKey}&output=json`);
      return this.normalizeDns(target, data);
    }

    if (queryType === 'reverseip') {
      // Reverse IP — find all domains on an IP
      const data = await this.httpGet(`https://api.viewdns.info/reverseip/?host=${encodeURIComponent(target)}&apikey=${apiKey}&output=json`);
      const domains = data?.response?.domains || [];
      return {
        ip: target,
        domains: domains.slice(0, 50).map(d => ({ name: d.name, last_resolved: d.last_resolved })),
        total: domains.length,
      };
    }

    if (queryType === 'whois') {
      const data = await this.httpGet(`https://api.viewdns.info/whois/?domain=${encodeURIComponent(target)}&apikey=${apiKey}&output=json`);
      return {
        registrar: data?.response?.registrar || '',
        created_date: data?.response?.create_date || '',
        expires_date: data?.response?.expiry_date || '',
        name_servers: data?.response?.nameservers || [],
        whois_text: (data?.response?.rawdata || '').slice(0, 1000),
      };
    }

    if (queryType === 'portscan') {
      const data = await this.httpGet(`https://api.viewdns.info/portscan/?host=${encodeURIComponent(target)}&apikey=${apiKey}&output=json`);
      return {
        ports: (data?.response?.port || []).map(p => ({
          port: p.number,
          service: p.service,
          status: p.status,
        })),
      };
    }

    // Default: DNS + reverse WHOIS combo for subdomains
    const dnsData = await this.httpGet(`https://api.viewdns.info/dnsrecord/?domain=${encodeURIComponent(target)}&recordtype=ANY&apikey=${apiKey}&output=json`);
    return this.normalizeDns(target, dnsData);
  }

  normalizeDns(domain, data) {
    const records = data?.response?.records || [];
    const subdomains = [];
    const dnsRecords = {};

    records.forEach(r => {
      const type = r.type || 'A';
      if (!dnsRecords[type]) dnsRecords[type] = [];
      dnsRecords[type].push(r.data || r.address || r.target || '');
      
      // Extract subdomains from CNAME/A records
      if (r.name && r.name.includes(domain) && !subdomains.includes(r.name)) {
        subdomains.push(r.name);
      }
    });

    return {
      domain,
      subdomains,
      count: subdomains.length,
      dns: dnsRecords,
      raw_records: records.slice(0, 30),
    };
  }

  getFallback(target) { return null; }
}
