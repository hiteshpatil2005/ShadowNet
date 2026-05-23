import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import Organization from '../models/Organization.js';
import User from '../models/User.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LeakedCredential from '../models/LeakedCredential.js';
import Correlation from '../models/Correlation.js';
import AttackPath from '../models/AttackPath.js';
import ThreatPersona from '../models/ThreatPersona.js';
import ExposureEvent from '../models/ExposureEvent.js';
import MonitoringConfig from '../models/MonitoringConfig.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shadownet';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[SEED] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Organization.deleteMany({}), User.deleteMany({}), DigitalAsset.deleteMany({}),
      LeakedCredential.deleteMany({}), Correlation.deleteMany({}), AttackPath.deleteMany({}),
      ThreatPersona.deleteMany({}), ExposureEvent.deleteMany({}), MonitoringConfig.deleteMany({}),
    ]);
    console.log('[SEED] Cleared existing data');

    // Create organization
    const org = await Organization.create({ name: 'ShadowNet AI Inc.', industry: 'Technology', size: 250, api_quota: 10000, subscription_tier: 'enterprise' });
    console.log('[SEED] Created organization:', org.name);

    // Create users
    const passwordHash = await bcrypt.hash('ShadowNet2026!', 12);
    const admin = await User.create({ email: 'analyst@shadownet.ai', password_hash: passwordHash, full_name: 'Alex Security', organization_id: org._id, role: 'admin' });
    await User.create({ email: 'viewer@shadownet.ai', password_hash: passwordHash, full_name: 'Jordan Viewer', organization_id: org._id, role: 'viewer' });
    console.log('[SEED] Created users');

    // Seed Digital Assets (Subdomains)
    const subdomains = [
      { asset_value: 'vpn.shadownet.ai', ip: '203.0.113.45', ports: [443, 8443], risk_level: 'critical', risk_score: 92, asset_type: 'subdomain', exposure_type: 'vulnerable', sources: ['Censys', 'crt.sh'], services: 'OpenVPN, Apache/2.4.49 (CVE-2021-41773)', metadata: { ssl_expiry: '2025-12-01', tech_stack: 'Apache, OpenVPN' } },
      { asset_value: 'staging.shadownet.ai', ip: '203.0.113.50', ports: [80, 443, 3000, 8080], risk_level: 'critical', risk_score: 88, asset_type: 'subdomain', exposure_type: 'public', sources: ['DNS Enum', 'ZoomEye'], services: 'Node.js Dev Server (no auth)', metadata: { ssl_expiry: '2026-03-15', tech_stack: 'Node.js, React' } },
      { asset_value: 'api.shadownet.ai', ip: '203.0.113.10', ports: [443], risk_level: 'high', risk_score: 75, asset_type: 'subdomain', exposure_type: 'public', sources: ['VirusTotal', 'SecurityTrails'], services: 'REST API (Swagger exposed)', metadata: { ssl_expiry: '2026-06-01', tech_stack: 'FastAPI, Python' } },
      { asset_value: 'dev-db.shadownet.ai', ip: '203.0.113.60', ports: [5432, 27017], risk_level: 'critical', risk_score: 95, asset_type: 'subdomain', exposure_type: 'vulnerable', sources: ['Censys', 'AbuseIPDB'], services: 'PostgreSQL, MongoDB (no auth)', metadata: { tech_stack: 'PostgreSQL 13, MongoDB 5' } },
      { asset_value: 'mail.shadownet.ai', ip: '203.0.113.20', ports: [25, 143, 993], risk_level: 'medium', risk_score: 45, asset_type: 'subdomain', exposure_type: 'public', sources: ['DNS Enum'], services: 'Postfix, Dovecot', metadata: { ssl_expiry: '2026-09-01', tech_stack: 'Postfix, Dovecot' } },
      { asset_value: 'jenkins.shadownet.ai', ip: '203.0.113.70', ports: [8080], risk_level: 'high', risk_score: 78, asset_type: 'subdomain', exposure_type: 'public', sources: ['URLScan', 'ZoomEye'], services: 'Jenkins CI (unauthenticated)', metadata: { tech_stack: 'Jenkins 2.361' } },
      { asset_value: 'grafana.shadownet.ai', ip: '203.0.113.80', ports: [3000], risk_level: 'medium', risk_score: 55, asset_type: 'subdomain', exposure_type: 'public', sources: ['crt.sh'], services: 'Grafana (default creds)', metadata: { tech_stack: 'Grafana 9.5' } },
      { asset_value: 'www.shadownet.ai', ip: '203.0.113.5', ports: [80, 443], risk_level: 'low', risk_score: 15, asset_type: 'subdomain', exposure_type: 'public', sources: ['crt.sh', 'SecurityTrails'], services: 'Nginx, React SPA', metadata: { ssl_expiry: '2026-12-01', tech_stack: 'Nginx, React' } },
      { asset_value: 'backup.shadownet.ai', ip: '203.0.113.90', ports: [22, 873], risk_level: 'high', risk_score: 72, asset_type: 'subdomain', exposure_type: 'vulnerable', sources: ['Censys'], services: 'rsync (open), SSH', metadata: { tech_stack: 'rsync, OpenSSH' } },
      { asset_value: 'admin.shadownet.ai', ip: '203.0.113.15', ports: [443, 8443], risk_level: 'high', risk_score: 80, asset_type: 'subdomain', exposure_type: 'public', sources: ['URLScan', 'AlienVault OTX'], services: 'Admin Panel (weak auth)', metadata: { tech_stack: 'PHP, Laravel' } },
    ];

    // Cloud resources
    const cloudAssets = [
      { asset_value: 'shadownet-prod-bucket', ip: '', risk_level: 'critical', risk_score: 90, asset_type: 'cloud_resource', cloud_provider: 'AWS', exposure_type: 'public', sources: ['Censys'], services: 'S3 Bucket (public-read)', metadata: { region: 'us-east-1', public: true } },
      { asset_value: 'shadownet-logs-bucket', ip: '', risk_level: 'high', risk_score: 70, asset_type: 'cloud_resource', cloud_provider: 'AWS', exposure_type: 'public', sources: ['Censys'], services: 'S3 Bucket (listing enabled)', metadata: { region: 'us-west-2', public: true } },
      { asset_value: 'shadownet-k8s-dashboard', ip: '10.0.1.50', risk_level: 'critical', risk_score: 93, asset_type: 'cloud_resource', cloud_provider: 'GCP', exposure_type: 'vulnerable', sources: ['ZoomEye'], services: 'Kubernetes Dashboard (no auth)', metadata: { cluster: 'prod-gke-01' } },
    ];

    const allAssets = [...subdomains, ...cloudAssets].map(a => ({ ...a, organization_id: org._id, first_discovered: new Date(Date.now() - Math.random() * 30 * 24 * 3600000), last_seen: new Date() }));
    const savedAssets = await DigitalAsset.insertMany(allAssets);
    console.log(`[SEED] Created ${savedAssets.length} digital assets`);

    // Seed Leaked Credentials
    const credentials = [
      { email: 'admin@shadownet.ai', source: 'DarkForums2024', breach_name: 'DarkForums Breach', leak_date: '2024-03-15', severity: 'CRITICAL', hash_type: 'bcrypt', leaked_password: '$2b$10...redacted', owner: 'IT Admin', credential_type: 'email', exposure_count: 3 },
      { email: 'dev@shadownet.ai', source: 'GitHubLeak', breach_name: 'GitHub Token Exposure', leak_date: '2024-06-22', severity: 'CRITICAL', hash_type: 'plaintext', leaked_password: 'ghp_xxxx...redacted', owner: 'DevOps Team', credential_type: 'token', exposure_count: 1 },
      { email: 'cto@shadownet.ai', source: 'LinkedInBreach', breach_name: 'LinkedIn 2024 Breach', leak_date: '2024-01-10', severity: 'HIGH', hash_type: 'SHA-256', leaked_password: 'a3f2...redacted', owner: 'CTO', credential_type: 'email', exposure_count: 2 },
      { email: 'hr@shadownet.ai', source: 'DataBreachDB', breach_name: 'HR Portal Breach', leak_date: '2024-08-05', severity: 'HIGH', hash_type: 'MD5', leaked_password: 'e99a1...redacted', owner: 'HR Department', credential_type: 'email', exposure_count: 1 },
      { email: 'support@shadownet.ai', source: 'PastebinDump', breach_name: 'Pastebin Dump 2024', leak_date: '2024-04-20', severity: 'MEDIUM', hash_type: 'plaintext', leaked_password: 'Support123!', owner: 'Support Team', credential_type: 'email', exposure_count: 4 },
      { email: 'api-key@shadownet.ai', source: 'TruffleHog', breach_name: 'Git Secrets Scan', leak_date: '2024-07-01', severity: 'CRITICAL', hash_type: 'plaintext', leaked_password: 'sk-live-xxxx...redacted', owner: 'Engineering', credential_type: 'api_key', exposure_count: 1 },
      { email: 'intern@shadownet.ai', source: 'BreachCompilation', breach_name: 'Breach Compilation III', leak_date: '2024-09-12', severity: 'MEDIUM', hash_type: 'SHA-1', leaked_password: 'da39a...redacted', owner: 'Intern', credential_type: 'email', exposure_count: 1 },
      { email: 'admin@shadownet.ai', source: 'RaidForums', breach_name: 'RaidForums Dump', leak_date: '2024-02-28', severity: 'CRITICAL', hash_type: 'bcrypt', leaked_password: '$2b$12...redacted', owner: 'IT Admin', credential_type: 'email', exposure_count: 5 },
    ];

    const savedCreds = await LeakedCredential.insertMany(credentials.map(c => ({ ...c, organization_id: org._id })));
    console.log(`[SEED] Created ${savedCreds.length} leaked credentials`);

    // Seed Correlations
    const correlations = [
      { title: 'VPN + Admin Credential Overlap', asset_id_1: 'vpn.shadownet.ai', asset_id_2: 'admin.shadownet.ai', credential: 'admin@shadownet.ai', correlation_type: 'credential_usage', risk_score: 94, severity: 'CRITICAL', confidence: '92%', description: 'Same admin credentials used for VPN and admin panel access', explanation: 'Compromised VPN credentials could directly lead to admin panel access', impact: 'Full infrastructure compromise possible', attack_scenarios: ['VPN credential reuse → admin panel access → lateral movement', 'Admin credential stuffing across all services'] },
      { title: 'Exposed Database + API Correlation', service: 'dev-db.shadownet.ai', cve: 'CVE-2021-44228', correlation_type: 'suspicious_relationship', risk_score: 91, severity: 'CRITICAL', confidence: '88%', description: 'Unauthenticated database accessible from the same network as the exposed API', explanation: 'API could be used as pivot point to access the unprotected database', impact: 'Direct data exfiltration possible', attack_scenarios: ['API exploitation → database access → data theft', 'MongoDB no-auth → full database dump'] },
      { title: 'Staging Environment Data Leakage', asset_id_1: 'staging.shadownet.ai', asset_id_2: 'shadownet-prod-bucket', correlation_type: 'suspicious_relationship', risk_score: 85, severity: 'HIGH', confidence: '78%', description: 'Staging server has production S3 bucket credentials in environment variables', explanation: 'Compromising the less-secured staging env leads to production data access', impact: 'Production data breach via staging', attack_scenarios: ['Staging exploitation → S3 credential extraction → prod data access'] },
      { title: 'Jenkins CI/CD Pipeline Risk', service: 'jenkins.shadownet.ai', credential: 'dev@shadownet.ai', correlation_type: 'credential_usage', risk_score: 82, severity: 'HIGH', confidence: '85%', description: 'Unauthenticated Jenkins with GitHub deploy keys', explanation: 'Jenkins can be used to inject malicious code into production deployments', impact: 'Supply chain compromise', attack_scenarios: ['Jenkins access → code injection → production deployment'] },
      { title: 'Backup Server SSH + Rsync Exposure', asset_id_1: 'backup.shadownet.ai', asset_id_2: 'dev-db.shadownet.ai', correlation_type: 'ip_hosting', risk_score: 76, severity: 'HIGH', confidence: '72%', description: 'Backup server with open rsync could expose database backups', explanation: 'Open rsync on backup server likely contains full database dumps', impact: 'Historical data exposure', attack_scenarios: ['rsync enumeration → backup download → credential extraction'] },
      { title: 'Cloud Storage Misconfiguration Chain', asset_id_1: 'shadownet-prod-bucket', asset_id_2: 'shadownet-logs-bucket', correlation_type: 'suspicious_relationship', risk_score: 88, severity: 'CRITICAL', confidence: '90%', description: 'Both S3 buckets publicly accessible with sensitive data', explanation: 'Logs bucket may contain API keys, tokens, and PII that enable further compromise', impact: 'Mass data exposure and credential harvesting', attack_scenarios: ['Log analysis → credential extraction → production access'] },
    ];

    await Correlation.insertMany(correlations.map(c => ({ ...c, organization_id: org._id })));
    console.log(`[SEED] Created ${correlations.length} correlations`);

    // Seed Attack Paths
    const attackPaths = [
      {
        name: 'Credential Stuffing → VPN → Internal Network',
        attack_scenario_type: 'credential_abuse', probability: '78%', success_probability: 78, impact: 'CRITICAL',
        timeline_estimate: '2-4 hours',
        stages: [
          { title: 'Harvest leaked credentials from dark web dumps', status: 'Simulated Vulnerable', technique: 'T1589 - Gather Victim Identity Info', details: 'admin@shadownet.ai credentials found in DarkForums2024 and RaidForums dumps', confidence: '95%' },
          { title: 'Credential stuffing attack on VPN endpoint', status: 'Simulated Vulnerable', technique: 'T1110.004 - Credential Stuffing', details: 'Automated attempts using leaked credentials against vpn.shadownet.ai', confidence: '82%' },
          { title: 'VPN access to internal network', status: 'Simulated Vulnerable', technique: 'T1133 - External Remote Services', details: 'Successfully authenticate to VPN, gain internal network access', confidence: '78%' },
          { title: 'Lateral movement to database servers', status: 'Simulated Vulnerable', technique: 'T1021 - Remote Services', details: 'Pivot from VPN to dev-db.shadownet.ai (no auth required)', confidence: '90%' },
          { title: 'Data exfiltration from production database', status: 'Simulated Vulnerable', technique: 'T1041 - Exfiltration Over C2', details: 'Extract customer data, credentials, and business records', confidence: '72%' },
        ],
        remediation: [
          { priority: 1, action: 'Enforce MFA on VPN', details: 'Deploy multi-factor authentication for all VPN connections immediately', status: 'Pending' },
          { priority: 2, action: 'Rotate all leaked credentials', details: 'Force password reset for admin@shadownet.ai and all associated accounts', status: 'Pending' },
          { priority: 3, action: 'Segment internal network', details: 'Implement network segmentation to prevent lateral movement from VPN to databases', status: 'Pending' },
          { priority: 4, action: 'Enable database authentication', details: 'Configure MongoDB and PostgreSQL authentication on dev-db.shadownet.ai', status: 'Pending' },
        ],
        ai_reasoning: 'This attack path has high probability because leaked credentials are confirmed in multiple breach databases, the VPN endpoint lacks MFA, and the internal database has no authentication.',
      },
      {
        name: 'Public S3 → Log Analysis → API Key Theft',
        attack_scenario_type: 'data_exfiltration', probability: '65%', success_probability: 65, impact: 'HIGH',
        timeline_estimate: '1-3 hours',
        stages: [
          { title: 'Discover publicly accessible S3 buckets', status: 'Simulated Vulnerable', technique: 'T1530 - Data from Cloud Storage', details: 'shadownet-logs-bucket found publicly accessible via Censys scan', confidence: '90%' },
          { title: 'Download and analyze log files', status: 'Simulated Vulnerable', technique: 'T1530 - Data from Cloud Storage', details: 'Application logs contain API keys, database connection strings', confidence: '75%' },
          { title: 'Use extracted API keys for production access', status: 'Simulated Vulnerable', technique: 'T1078 - Valid Accounts', details: 'Authenticate to production APIs using extracted service account keys', confidence: '60%' },
        ],
        remediation: [
          { priority: 1, action: 'Restrict S3 bucket permissions', details: 'Remove public-read ACL from both prod and logs buckets', status: 'Pending' },
          { priority: 2, action: 'Rotate all API keys in logs', details: 'Identify and rotate any API keys, tokens found in log files', status: 'Pending' },
          { priority: 3, action: 'Implement log sanitization', details: 'Strip sensitive data from application logs before storage', status: 'Pending' },
        ],
        ai_reasoning: 'S3 misconfiguration is a common attack vector, and log files frequently contain sensitive credentials.',
      },
    ];

    await AttackPath.insertMany(attackPaths.map(p => ({ ...p, organization_id: org._id })));
    console.log(`[SEED] Created ${attackPaths.length} attack paths`);

    // Seed Threat Personas
    const personas = [
      { name: 'FIN7 (Carbanak)', predicted_attacker_type: 'Cybercriminals', category: 'Financial Crime Syndicate', origin: 'Eastern Europe', motivation: 'Financial gain through data theft and ransomware', confidence: '72%', confidence_score: 0.72, capability_level: 'advanced', target_assets: 'Payment systems, customer databases, cloud infrastructure', description: 'Sophisticated threat group known for targeting technology companies with exposed financial infrastructure. Uses spear-phishing and supply chain attacks.', ransom_likelihood: '45%', phishing_risk: '85%' },
      { name: 'Scattered Spider (UNC3944)', predicted_attacker_type: 'Cybercriminals', category: 'Social Engineering Specialists', origin: 'United States / United Kingdom', motivation: 'Financial gain through SIM swapping and credential theft', confidence: '58%', confidence_score: 0.58, capability_level: 'intermediate', target_assets: 'Identity systems, MFA tokens, cloud admin panels', description: 'Young threat actors using advanced social engineering, SIM swapping, and MFA fatigue attacks to breach cloud-first organizations.', ransom_likelihood: '65%', phishing_risk: '92%' },
      { name: 'Lazarus Group (APT38)', predicted_attacker_type: 'Nation-State', category: 'State-Sponsored APT', origin: 'North Korea', motivation: 'Revenue generation through cryptocurrency theft and espionage', confidence: '35%', confidence_score: 0.35, capability_level: 'nation-state', target_assets: 'Cryptocurrency wallets, financial systems, source code', description: 'Nation-state actor known for sophisticated attacks on financial institutions and technology companies.', ransom_likelihood: '25%', phishing_risk: '70%' },
      { name: 'Disgruntled Insider', predicted_attacker_type: 'Insiders', category: 'Insider Threat', origin: 'Internal', motivation: 'Revenge, financial incentive, or ideology', confidence: '42%', confidence_score: 0.42, capability_level: 'intermediate', target_assets: 'Source code, customer data, internal communications', description: 'Current or former employees with legitimate access who may exfiltrate data or sabotage systems.', ransom_likelihood: '15%', phishing_risk: '10%' },
    ];

    await ThreatPersona.insertMany(personas.map(p => ({ ...p, organization_id: org._id })));
    console.log(`[SEED] Created ${personas.length} threat personas`);

    // Seed Exposure Events (Alerts)
    const events = [
      { event_type: 'credential_leak', severity: 'CRITICAL', title: 'Admin credentials found in dark web dump', description: 'admin@shadownet.ai credentials detected in DarkForums2024 breach database', event: 'Credential Exposure Detected', asset: 'admin@shadownet.ai', category: 'Credential Exposure', status: 'Active' },
      { event_type: 'new_exposure', severity: 'CRITICAL', title: 'Unauthenticated database exposed to internet', description: 'dev-db.shadownet.ai MongoDB instance accessible without authentication on port 27017', event: 'Open Database Detected', asset: 'dev-db.shadownet.ai', category: 'Infrastructure Exposure', status: 'Active' },
      { event_type: 'new_exposure', severity: 'CRITICAL', title: 'Public S3 bucket with production data', description: 'shadownet-prod-bucket is publicly readable and contains customer data', event: 'Cloud Misconfiguration', asset: 'shadownet-prod-bucket', category: 'Cloud Exposure', status: 'New' },
      { event_type: 'infrastructure_change', severity: 'HIGH', title: 'Jenkins CI unauthenticated access', description: 'jenkins.shadownet.ai accessible without authentication, exposes build secrets', event: 'CI/CD Exposure', asset: 'jenkins.shadownet.ai', category: 'Infrastructure Exposure', status: 'Active' },
      { event_type: 'certificate_issued', severity: 'MEDIUM', title: 'New SSL certificate detected for unknown subdomain', description: 'Certificate issued for test-legacy.shadownet.ai — not in asset inventory', event: 'Certificate Transparency Alert', asset: 'test-legacy.shadownet.ai', category: 'Asset Discovery', status: 'New' },
      { event_type: 'credential_leak', severity: 'HIGH', title: 'API key exposed in public GitHub repository', description: 'GitHub token ghp_xxxx found in public commit by dev@shadownet.ai', event: 'Secret Exposure', asset: 'dev@shadownet.ai', category: 'Credential Exposure', status: 'Active' },
      { event_type: 'correlation_detected', severity: 'CRITICAL', title: 'High-risk correlation: VPN + Admin credentials', description: 'Same credentials used for VPN and admin panel detected with 94% risk score', event: 'Correlation Alert', asset: 'vpn.shadownet.ai', category: 'Correlation Alert', status: 'New' },
      { event_type: 'new_exposure', severity: 'MEDIUM', title: 'Grafana dashboard with default credentials', description: 'grafana.shadownet.ai accessible with admin/admin default credentials', event: 'Default Credentials', asset: 'grafana.shadownet.ai', category: 'Infrastructure Exposure', status: 'Active' },
      { event_type: 'new_exposure', severity: 'HIGH', title: 'Kubernetes dashboard exposed without auth', description: 'shadownet-k8s-dashboard accessible from internet without authentication', event: 'Cloud Misconfiguration', asset: 'shadownet-k8s-dashboard', category: 'Cloud Exposure', status: 'New' },
      { event_type: 'infrastructure_change', severity: 'LOW', title: 'DNS record change detected', description: 'mail.shadownet.ai MX record updated to new mail provider', event: 'DNS Change', asset: 'mail.shadownet.ai', category: 'Asset Discovery', status: 'Acknowledged', acknowledged: true },
    ];

    await ExposureEvent.insertMany(events.map((e, i) => ({
      ...e,
      organization_id: org._id,
      timestamp: new Date(Date.now() - (i * 3600000 * Math.random() * 48)),
    })));
    console.log(`[SEED] Created ${events.length} exposure events`);

    // Seed Monitoring Config
    await MonitoringConfig.create({
      organization_id: org._id,
      monitoring_enabled: true,
      scan_interval: 24,
      ti_sources_enabled: ['alienvault', 'abuseipdb', 'virustotal', 'crtsh', 'urlscan', 'abusech', 'nvd', 'ripestat'],
      alert_rules: [
        { keyword: 'shadownet.ai', type: 'Domain Monitor', active: true },
        { keyword: 'admin@shadownet.ai', type: 'Credential Monitor', active: true },
        { keyword: 'CVE-2021', type: 'CVE Monitor', active: true },
        { keyword: 'S3 bucket', type: 'Cloud Monitor', active: false },
      ],
      notification_channels: { slack: true, teams: false, email: true },
    });
    console.log('[SEED] Created monitoring config');

    console.log('\n[SEED] ✅ Database seeded successfully!');
    console.log('[SEED] Login credentials: analyst@shadownet.ai / ShadowNet2026!');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exit(1);
  }
}

seed();
