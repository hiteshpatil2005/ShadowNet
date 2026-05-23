// ShadowNet AI Comprehensive Cybersecurity Intelligence Mock Data

export const mockStats = {
  exposedAssets: { total: 1428, change: "+14%", trend: "up" },
  criticalVulnerabilities: { total: 12, change: "-3", trend: "down" },
  activeThreats: { total: 4, change: "+1", trend: "up" },
  monitoringCoverage: { total: "98.4%", change: "+0.5%", trend: "up" },
  riskScore: { current: 78, change: "+4", trend: "up", rating: "HIGH RISK" }
};

export const mockRiskTrends = [
  { date: "May 01", score: 65, assets: 1200, vulnerabilities: 15 },
  { date: "May 05", score: 68, assets: 1220, vulnerabilities: 14 },
  { date: "May 10", score: 72, assets: 1280, vulnerabilities: 13 },
  { date: "May 15", score: 70, assets: 1320, vulnerabilities: 11 },
  { date: "May 20", score: 74, assets: 1390, vulnerabilities: 14 },
  { date: "May 23", score: 78, assets: 1428, vulnerabilities: 12 }
];

export const mockAlerts = [
  {
    id: "AL-8041",
    timestamp: "2026-05-23T08:45:00Z",
    severity: "CRITICAL",
    category: "Credential Leak",
    title: "Domain Admin Credentials Found on Breach Forum",
    description: "Plaintext credentials for 'admin@shadownet-ai.com' exposed in 'BlackByte' threat forum leak. Verified active in Active Directory.",
    asset: "admin@shadownet-ai.com",
    status: "Active"
  },
  {
    id: "AL-8042",
    timestamp: "2026-05-23T07:12:00Z",
    severity: "CRITICAL",
    category: "Cloud Exposure",
    title: "Unsecured AWS S3 Bucket Exposing Customer PII",
    description: "S3 Bucket 'shadownet-prod-billing-backups' is public-readable. Contains over 14,000 invoices with plaintext PII and credit card tokens.",
    asset: "s3://shadownet-prod-billing-backups",
    status: "Active"
  },
  {
    id: "AL-8043",
    timestamp: "2026-05-22T23:30:00Z",
    severity: "HIGH",
    category: "Port Vulnerability",
    title: "Exposed SMB Port (445) with Active DoublePulsar Backdoor",
    description: "Host 45.18.239.112 (vpn.shadownet-ai.com) exposes port 445 and responds to SMBv1 commands showing potential exploitation indicators.",
    asset: "45.18.239.112",
    status: "Investigating"
  },
  {
    id: "AL-8044",
    timestamp: "2026-05-22T14:15:00Z",
    severity: "HIGH",
    category: "API Exposure",
    title: "Unauthenticated API Gateway Resolving to Dev Environment",
    description: "API Gateway endpoint 'https://api-dev.shadownet-ai.com/v1/users' does not enforce Bearer token verification and leaks administrative scopes.",
    asset: "api-dev.shadownet-ai.com",
    status: "Active"
  },
  {
    id: "AL-8045",
    timestamp: "2026-05-22T10:05:00Z",
    severity: "MEDIUM",
    category: "Certificate Expiry",
    title: "SSL/TLS Certificate Misconfiguration",
    description: "Certificate for 'staging.shadownet-ai.com' expired 12 days ago. Host is still accepting connections over invalid certificate.",
    asset: "staging.shadownet-ai.com",
    status: "Acknowledged"
  },
  {
    id: "AL-8046",
    timestamp: "2026-05-21T18:50:00Z",
    severity: "LOW",
    category: "Information Disclosure",
    title: "Server Banner Leaking Specific Apache Tomcat Version",
    description: "Host 45.18.239.115 response headers leak 'Server: Apache-Coyote/1.1' and 'Tomcat/8.5.31' exposing it to known CVEs.",
    asset: "45.18.239.115",
    status: "Resolved"
  }
];

export const mockSubdomains = [
  {
    id: "sub-1",
    name: "shadownet-ai.com",
    ip: "45.18.239.100",
    riskScore: 24,
    source: "DNS AXFR",
    ports: [80, 443],
    cloudProvider: "AWS (US-East-1)",
    services: "Cloudflare CDN, Nginx, React App",
    lastSeen: "2026-05-23T08:00:00Z"
  },
  {
    id: "sub-2",
    name: "vpn.shadownet-ai.com",
    ip: "45.18.239.112",
    riskScore: 88,
    source: "Active Scan",
    ports: [443, 445, 1194],
    cloudProvider: "Self-Hosted (Co-location)",
    services: "OpenVPN Access Server, Samba 4.1, Apache",
    lastSeen: "2026-05-23T07:30:00Z"
  },
  {
    id: "sub-3",
    name: "api-dev.shadownet-ai.com",
    ip: "45.18.239.105",
    riskScore: 82,
    source: "Certificate Transparency",
    ports: [80, 443, 8080],
    cloudProvider: "Google Cloud (us-central1)",
    services: "NodeJS / Express Gateway, Swagger API UI, Jenkins CI/CD",
    lastSeen: "2026-05-23T06:15:00Z"
  },
  {
    id: "sub-4",
    name: "staging.shadownet-ai.com",
    ip: "45.18.239.115",
    riskScore: 56,
    source: "DNS Brute Force",
    ports: [80, 443, 8080, 8443],
    cloudProvider: "AWS (US-East-2)",
    services: "Apache Tomcat 8.5.31, MySQL Database, React Web",
    lastSeen: "2026-05-23T05:00:00Z"
  },
  {
    id: "sub-5",
    name: "mail.shadownet-ai.com",
    ip: "45.18.239.102",
    riskScore: 42,
    source: "MX Record Registry",
    ports: [25, 110, 143, 465, 993, 995],
    cloudProvider: "Self-Hosted (Co-location)",
    services: "Microsoft Exchange Server 2019, Outlook Web Access (OWA)",
    lastSeen: "2026-05-23T08:12:00Z"
  },
  {
    id: "sub-6",
    name: "billing.shadownet-ai.com",
    ip: "108.156.40.85",
    riskScore: 75,
    source: "Active Crawling",
    ports: [443],
    cloudProvider: "AWS (US-West-2)",
    services: "PHP Laravel 9.2, Stripe Gateway, AWS S3 Client",
    lastSeen: "2026-05-23T02:30:00Z"
  },
  {
    id: "sub-7",
    name: "gitlab.shadownet-ai.com",
    ip: "45.18.239.108",
    riskScore: 68,
    source: "Subdomain Takeover Scan",
    ports: [22, 80, 443],
    cloudProvider: "DigitalOcean (NYC3)",
    services: "GitLab Enterprise Edition (v15.2), PostgreSQL",
    lastSeen: "2026-05-22T21:40:00Z"
  }
];

export const mockCredentials = [
  {
    id: "cred-1",
    email: "admin@shadownet-ai.com",
    hashType: "Plaintext",
    leakedPassword: "ShadowPassword2026!",
    source: "BlackByte Breach Forum Dump",
    leakDate: "2026-05-23",
    severity: "CRITICAL",
    owner: "Sarah Jenkins (Director of IT)",
    verified: true
  },
  {
    id: "cred-2",
    email: "hitesh.patil@shadownet-ai.com",
    hashType: "Bcrypt ($2a$12)",
    leakedPassword: "Decrypted: hitesh#123",
    source: "Redline Infostealer Log Leak",
    leakDate: "2026-05-18",
    severity: "HIGH",
    owner: "Hitesh Patil (DevOps Engineer)",
    verified: true
  },
  {
    id: "cred-3",
    email: "sales-mktg@shadownet-ai.com",
    hashType: "MD5 Hash",
    leakedPassword: "Decrypted: welcome123",
    source: "Apollo.io Marketing DB Leak",
    leakDate: "2026-04-12",
    severity: "MEDIUM",
    owner: "Shared Mailbox (Marketing Team)",
    verified: false
  },
  {
    id: "cred-4",
    email: "shradha.shinde@shadownet-ai.com",
    hashType: "SHA-1 Hash",
    leakedPassword: "Uncracked (e1284a...)",
    source: "LinkedIn Combined Credential Leak",
    leakDate: "2025-11-02",
    severity: "LOW",
    owner: "Shradha Shinde (Product Manager)",
    verified: false
  }
];

export const mockCloudExposures = [
  {
    id: "cloud-1",
    bucketName: "shadownet-prod-billing-backups",
    provider: "AWS S3",
    riskRating: "CRITICAL",
    piiCount: 14205,
    filesExposed: [
      { name: "invoice_dump_2026_05.csv", type: "CSV Database", size: "142 MB" },
      { name: "aws_access_keys.txt", type: "IAM Credentials", size: "1.2 KB" },
      { name: "ssl_certificate.pfx", type: "Private Key Store", size: "45 KB" }
    ],
    configurationIssue: "Public Access Block disabled; Policies granting 's3:GetObject' to All Principal (*)"
  },
  {
    id: "cloud-2",
    bucketName: "shadownet-marketing-images",
    provider: "AWS S3",
    riskRating: "LOW",
    piiCount: 0,
    filesExposed: [
      { name: "logo.png", type: "Image", size: "230 KB" },
      { name: "banner_hero.jpg", type: "Image", size: "1.4 MB" }
    ],
    configurationIssue: "Public access intended, but contains listing access (ListBucket) which leaks file structure."
  },
  {
    id: "cloud-3",
    bucketName: "dev-postgres-backups-shadow",
    provider: "Google Cloud Storage",
    riskRating: "HIGH",
    piiCount: 3500,
    filesExposed: [
      { name: "pg_dump_2026_05_12.sql", type: "Postgres Dump", size: "940 MB" }
    ],
    configurationIssue: "Bucket exposed due to legacy IAM policy granting 'allUsers' the Storage Object Viewer role."
  }
];

export const mockCorrelations = {
  grid: [
    { service: "vpn.shadownet-ai.com (OpenVPN)", cve: "CVE-2023-46805 (Vulnerability)", credential: "admin@shadownet-ai.com (Leaked)", severity: "CRITICAL", confidence: "95%", riskScore: 96 },
    { service: "api-dev.shadownet-ai.com (Jenkins)", cve: "CVE-2024-23897 (Arbitrary File Read)", credential: "hitesh.patil@shadownet-ai.com (Leaked)", severity: "CRITICAL", confidence: "90%", riskScore: 92 },
    { service: "staging.shadownet-ai.com (Tomcat)", cve: "CVE-2020-1938 (Ghostcat Local File Include)", credential: "shradha.shinde@shadownet-ai.com (Uncracked)", severity: "HIGH", confidence: "75%", riskScore: 78 },
    { service: "mail.shadownet-ai.com (Exchange/OWA)", cve: "CVE-2021-34473 (ProxyShell RCE)", credential: "sales-mktg@shadownet-ai.com (MD5 Leaked)", severity: "HIGH", confidence: "80%", riskScore: 82 },
    { service: "gitlab.shadownet-ai.com (GitLab)", cve: "CVE-2023-7028 (Account Takeover)", credential: "hitesh.patil@shadownet-ai.com (Leaked)", severity: "CRITICAL", confidence: "92%", riskScore: 94 }
  ],
  relationships: [
    {
      title: "Active Directory Domain Dominance Path",
      description: "Correlating admin@shadownet-ai.com leaked plaintext credential with exposed vpn.shadownet-ai.com endpoint allowing remote gateway authentication.",
      impact: "Attacker logs into VPN using verified admin credentials, gains direct internal network access, pivots to domain controllers, and achieves complete forest takeover.",
      severity: "CRITICAL",
      confidence: "98%"
    },
    {
      title: "Jenkins Dev Credential to Cloud Takeover Path",
      description: "Correlating dev-credentials for hitesh.patil@shadownet-ai.com leaked on Redline Infostealer with exposed Jenkins CI/CD pipeline at api-dev.shadownet-ai.com.",
      impact: "Attacker accesses DevOps Engineer account on Jenkins, modifies pipeline configurations to inject malicious scripts into staging, steals AWS access keys residing in S3, taking over AWS prod environments.",
      severity: "CRITICAL",
      confidence: "92%"
    }
  ]
};

export const mockAttackPaths = [
  {
    id: "path-1",
    name: "Ransomware Delivery & Executive Network Compromise",
    probability: "87%",
    impact: "CRITICAL",
    stages: [
      {
        title: "Reconnaissance & Footprint Identification",
        status: "Completed",
        technique: "Subdomain Scans & Credential Harvesting",
        details: "Attacker identifies vpn.shadownet-ai.com hosting an exposed service and harvests admin@shadownet-ai.com credentials from BlackByte forums.",
        confidence: "98%"
      },
      {
        title: "Initial Access & Authentication Bypass",
        status: "Simulated Vulnerable",
        technique: "VPN Credential Replay (T1133)",
        details: "Attacker bypasses MFA by replaying active session cookies harvested from Redline logs or logs in directly using plaintext VPN password.",
        confidence: "92%"
      },
      {
        title: "Lateral Movement & Internal Recon",
        status: "Simulated Vulnerable",
        technique: "SMB Scanning & Remote Access Tool Deployment (T1021)",
        details: "Attacker maps internal subnet, discovers Active Directory Domain Controller at 10.100.10.5, and deploys Cobalt Strike beacon via SMBv1 DoublePulsar vulnerability.",
        confidence: "88%"
      },
      {
        title: "Privilege Escalation & Domain Dominance",
        status: "Simulated Vulnerable",
        technique: "Kerberoasting & DCSync Attack (T1558)",
        details: "Attacker extracts Kerberos ticket grants, performs offline cracking of service accounts, triggers DCSync, extracts all hash files, and achieves domain admin privilege.",
        confidence: "85%"
      },
      {
        title: "Data Exfiltration & Ransomware Deployment",
        status: "Simulated Vulnerable",
        technique: "Ransomware Encryption & Mega.nz Upload (T1486)",
        details: "Attacker exfiltrates 40GB of sensitive source code and finance databases, terminates backups in AWS (via stolen S3 keys), and deploys BlackByte Ransomware across all servers.",
        confidence: "91%"
      }
    ],
    remediation: [
      { priority: 1, action: "Enforce Immediate Password Reset", details: "Force password reset for admin@shadownet-ai.com and audit AD for unauthorized ticket grants.", status: "Pending" },
      { priority: 2, action: "Enable Strict Multi-Factor Authentication", details: "Mandate hardware keys (YubiKey) or push notification token validation on OpenVPN gateway.", status: "Pending" },
      { priority: 3, action: "Remediate Exposed SMB on vpn.shadownet-ai.com", details: "Block TCP port 445 on external-facing firewall and disable SMBv1 legacy protocols.", status: "In Progress" },
      { priority: 4, action: "Revoke AWS IAM keys & secure S3 bucket", details: "Rotate the keys leaked in shadownet-prod-billing-backups and set bucket permissions to private.", status: "Pending" }
    ]
  },
  {
    id: "path-2",
    name: "CI/CD Code Injection & Cloud Resource Hijacking",
    probability: "72%",
    impact: "HIGH",
    stages: [
      {
        title: "Reconnaissance & Asset Profiling",
        status: "Completed",
        technique: "Active API Crawling",
        details: "Attacker discovers api-dev.shadownet-ai.com exposing Jenkins build dashboards and Gitlab repositories.",
        confidence: "95%"
      },
      {
        title: "Credential Abuse & System Takeover",
        status: "Simulated Vulnerable",
        technique: "Dev Account Login",
        details: "Attacker logs in as Hitesh Patil using credentials cracked from Redline logs. Account holds master merge and push privileges.",
        confidence: "88%"
      },
      {
        title: "Code Pipeline Injection",
        status: "Simulated Vulnerable",
        technique: "Poison Pipeline Execution (T1195)",
        details: "Attacker injects a malicious bash shell into the Docker container assembly stage inside `Jenkinsfile`, which runs during every staging build.",
        confidence: "82%"
      },
      {
        title: "AWS Cloud Infrastructure Control",
        status: "Simulated Vulnerable",
        technique: "Credential Harvesting from Container Environment (T1552)",
        details: "Malicious container extracts IAM EC2 role keys from metadata server, gains full S3 access, and steals database backups.",
        confidence: "78%"
      }
    ],
    remediation: [
      { priority: 1, action: "Audit Hitesh Patil DevOps Accounts", details: "Temporarily revoke GitLab/Jenkins authorization for hitesh.patil@shadownet-ai.com, reset credentials.", status: "Pending" },
      { priority: 2, action: "Secure Jenkins Build Server", details: "Enforce OAuth2 behind SSO, disable public signups, restrict access to VPN-only IPs.", status: "Pending" },
      { priority: 3, action: "Implement Branch Protection & Code Signing", details: "Require dual approvals on GitLab commits before pipeline trigger.", status: "In Progress" }
    ]
  }
];

export const mockThreatPersonas = [
  {
    id: "tp-1",
    name: "APT29 (Cozy Bear)",
    category: "State-Sponsored / Nation-State",
    origin: "Russian Federation",
    motivation: "Espionage, Data Gathering, Strategic Influence",
    targetAssets: "Active Directory, Exchange Mail servers, DevOps repositories",
    confidence: "82%",
    description: "Highly sophisticated threat actor focusing on stealthy operations. Known to leverage compromised VPN gateways, stolen AD credentials, and supply chain poisoning.",
    ransomLikelihood: "Very Low (Aims for silent persistence, not ransom)",
    phishingRisk: "CRITICAL (Uses spear-phishing targeting senior leadership)"
  },
  {
    id: "tp-2",
    name: "BlackByte Syndicate",
    category: "Organized Cybercrime Group",
    origin: "Eastern Europe (Decentralized)",
    motivation: "Financial Extortion (Double-Extrusion Ransomware)",
    targetAssets: "Finance backups, exposed S3 buckets, local file shares",
    confidence: "94%",
    description: "Operates an aggressive Ransomware-as-a-Service model. Actively targets companies exhibiting open network shares, old credentials, and unpatched Samba servers.",
    ransomLikelihood: "CRITICAL (Expected ransom demands: $2.5M - $5.0M)",
    phishingRisk: "Medium (Prefers network ingress via compromised edge devices)"
  },
  {
    id: "tp-3",
    name: "FIN7 Group",
    category: "Financial Cybercriminals",
    origin: "Eastern Europe",
    motivation: "Direct Financial Theft, Credit Card Harvesting",
    targetAssets: "Billing subdomains, Stripe configurations, unpatched databases",
    confidence: "78%",
    description: "Specialized in compromising commercial entities to harvest cardholder PII and insert card skimmers. Active threats target billing.shadownet-ai.com S3 bucket exposures.",
    ransomLikelihood: "High (Uses extortion if card database harvest fails)",
    phishingRisk: "HIGH (Crafts highly customized billing dispute emails)"
  }
];

export const mockInfrastructureGraph = {
  nodes: [
    // Center Domain Node
    { id: "shadownet", type: "domain", label: "shadownet-ai.com", risk: "medium", x: 400, y: 300, ip: "45.18.239.100", details: "Primary Domain" },
    
    // Subdomain Nodes
    { id: "vpn", type: "subdomain", label: "vpn.shadownet-ai.com", risk: "critical", x: 250, y: 150, ip: "45.18.239.112", details: "OpenVPN Endpoint" },
    { id: "apidev", type: "subdomain", label: "api-dev.shadownet-ai.com", risk: "critical", x: 550, y: 150, ip: "45.18.239.105", details: "API & Jenkins Portal" },
    { id: "staging", type: "subdomain", label: "staging.shadownet-ai.com", risk: "high", x: 200, y: 450, ip: "45.18.239.115", details: "Tomcat 8.5 Testbed" },
    { id: "billing", type: "subdomain", label: "billing.shadownet-ai.com", risk: "high", x: 600, y: 450, ip: "108.156.40.85", details: "Billing Frontend" },
    
    // Service Nodes
    { id: "srv-smb", type: "service", label: "SMB Service (Port 445)", risk: "critical", x: 100, y: 100, details: "Samba 4.1 with SMBv1 exposed" },
    { id: "srv-tomcat", type: "service", label: "Tomcat 8.5.31 (Port 8080)", risk: "high", x: 80, y: 480, details: "Vulnerable to Ghostcat CVE-2020-1938" },
    { id: "srv-jenkins", type: "service", label: "Jenkins CI/CD (Port 8080)", risk: "critical", x: 720, y: 100, details: "Jenkins server with public-readable build history" },
    
    // Cloud S3 Storage Node
    { id: "s3-billing", type: "cloud", label: "s3://shadownet-prod-billing-backups", risk: "critical", x: 780, y: 400, details: "AWS S3 exposing invoices, PII & keys" },
    
    // Leaked Credential Nodes
    { id: "cred-admin", type: "credential", label: "admin@shadownet-ai.com", risk: "critical", x: 400, y: 80, details: "Plaintext exposed 'ShadowPassword2026!'" },
    { id: "cred-dev", type: "credential", label: "hitesh.patil@shadownet-ai.com", risk: "high", x: 500, y: 80, details: "DevOps master credentials" }
  ],
  edges: [
    { id: "e1", source: "shadownet", target: "vpn", label: "resolves_to", risk: "low" },
    { id: "e2", source: "shadownet", target: "apidev", label: "resolves_to", risk: "low" },
    { id: "e3", source: "shadownet", target: "staging", label: "resolves_to", risk: "low" },
    { id: "e4", source: "shadownet", target: "billing", label: "resolves_to", risk: "low" },
    
    { id: "e5", source: "vpn", target: "srv-smb", label: "hosts_service", risk: "critical" },
    { id: "e6", source: "staging", target: "srv-tomcat", label: "hosts_service", risk: "high" },
    { id: "e7", source: "apidev", target: "srv-jenkins", label: "hosts_service", risk: "critical" },
    
    { id: "e8", source: "billing", target: "s3-billing", label: "accesses_cloud", risk: "critical" },
    
    { id: "e9", source: "cred-admin", target: "vpn", label: "authorizes_vpn", risk: "critical" },
    { id: "e10", source: "cred-dev", target: "srv-jenkins", label: "admin_access", risk: "critical" }
  ]
};

export const mockMonitoringLogs = [
  { id: "log-1", timestamp: "2026-05-23T08:58:12Z", event: "API Discovery Engine", details: "Discovered new endpoint '/api/v1/debug/dump' exposing stacktraces.", severity: "HIGH", status: "New" },
  { id: "log-2", timestamp: "2026-05-23T08:45:00Z", event: "Deep Web Crawler", details: "Leaked credential found matching 'admin@shadownet-ai.com'. Password: 'ShadowPassword2026!'", severity: "CRITICAL", status: "Active" },
  { id: "log-3", timestamp: "2026-05-23T07:12:00Z", event: "Cloud Leak Guard", details: "AWS S3 Bucket 'shadownet-prod-billing-backups' policy changed. Configured public-readable.", severity: "CRITICAL", status: "Active" },
  { id: "log-4", timestamp: "2026-05-23T04:22:15Z", event: "DNS Monitor", details: "Subdomain 'billing.shadownet-ai.com' resolved to new IP (108.156.40.85). Provider: AWS EC2.", severity: "INFO", status: "Acknowledge" },
  { id: "log-5", timestamp: "2026-05-22T21:40:30Z", event: "Active Port Scan", details: "Port 443 opened on 'gitlab.shadownet-ai.com'. Certificate resolves correctly.", severity: "INFO", status: "Closed" },
  { id: "log-6", timestamp: "2026-05-22T18:15:00Z", event: "Credential Leak Crawler", details: "Leaked credential found matching 'hitesh.patil@shadownet-ai.com'. Redline infostealer log parsed.", severity: "HIGH", status: "Investigating" }
];

export const mockTemplates = [
  { id: "temp-1", name: "C-Level Executive Summary", type: "Executive", sections: 4, desc: "A high-level risk overview showing overall risk score, critical alerts summary, and primary threat pathways written for non-technical executives." },
  { id: "temp-2", name: "Comprehensive Technical Analysis", type: "Technical", sections: 8, desc: "A comprehensive listing of exposed subdomains, active services, details on vulnerability mappings, and all credential leaks with mitigation plans." },
  { id: "temp-3", name: "Compliance & Audit Readiness Report", type: "Compliance", sections: 5, desc: "A focused compliance assessment comparing digital exposure against ISO 27001 (A.12) and SOC 2 Type II trust principles." }
];
