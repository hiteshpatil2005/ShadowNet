import BaseAdapter from './baseAdapter.js';
import env from '../../config/env.js';

export default class CriminalIPAdapter extends BaseAdapter {
  constructor() { super('criminalip', env.CRIMINALIP_API_KEY); }

  async fetchFromAPI(target, queryType) {
    const headers = { 'x-api-key': this.apiKey };

    if (queryType === 'host' || queryType === 'ip') {
      // IP Report — detailed host info, open ports, vulnerabilities
      const data = await this.httpGet(`https://api.criminalip.io/v1/asset/ip/report?ip=${encodeURIComponent(target)}`, headers);
      return this.normalizeHost(data);
    }

    if (queryType === 'domain') {
      // Domain report — subdomains, DNS, technologies
      const data = await this.httpGet(`https://api.criminalip.io/v1/domain/report?query=${encodeURIComponent(target)}`, headers);
      return this.normalizeDomain(data);
    }

    // Banner search — find services matching a query
    const data = await this.httpGet(`https://api.criminalip.io/v1/banner/search?query=${encodeURIComponent(target)}&offset=0`, headers);
    return {
      total: data?.data?.count || 0,
      results: (data?.data?.result || []).slice(0, 20).map(r => ({
        ip: r.ip_address,
        port: r.open_port_no,
        service: r.app_name || '',
        banner: (r.banner || '').slice(0, 200),
        country: r.country || '',
        as_name: r.as_name || '',
      })),
    };
  }

  normalizeHost(data) {
    const report = data?.data || {};
    return {
      ip: report.ip || '',
      score: report.score?.inbound || 0,
      is_malicious: report.score?.is_malicious || false,
      ports: (report.port || []).map(p => ({
        port: p.open_port_no,
        protocol: p.protocol,
        service: p.app_name || '',
        banner: (p.banner || '').slice(0, 200),
        confirmed_time: p.confirmed_time,
      })),
      country: report.whois?.country || '',
      organization: report.whois?.org_name || '',
      hostname: report.hostname || [],
      vulnerabilities: (report.vulnerability || []).slice(0, 10).map(v => ({
        cve_id: v.cve_id,
        cvss_score: v.cvss_score,
        port: v.open_port_no,
      })),
      location: {
        country: report.whois?.country || '',
        city: report.whois?.city || '',
      },
    };
  }

  normalizeDomain(data) {
    const report = data?.data || {};
    return {
      domain: report.domain || '',
      dns_records: report.dns || [],
      subdomains: (report.subdomain || []).map(s => s.subdomain || s),
      technologies: (report.technology || []).map(t => t.tech_name || t),
      certificates: (report.certificate || []).slice(0, 10),
      connected_ips: (report.connected_ip || []).slice(0, 10),
    };
  }

  getFallback(target) {
    return {
      _source: 'criminalip', _fallback: true, target,
      ip: target,
      score: 2,
      is_malicious: false,
      ports: [
        { port: 443, protocol: 'TCP', service: 'HTTPS', banner: '' },
        { port: 80, protocol: 'TCP', service: 'HTTP', banner: '' },
      ],
      country: 'US',
      organization: 'Cloudflare Inc.',
      hostname: [],
      vulnerabilities: [],
      location: { country: 'US', city: 'San Francisco' },
    };
  }
}
