import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: process.env.PORT || 5001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/shadownet',
  JWT_SECRET: process.env.JWT_SECRET || 'shadownet-dev-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'shadownet-dev-refresh-secret',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Threat Intelligence
  ALIENVAULT_OTX_KEY: process.env.ALIENVAULT_OTX_KEY || '',
  ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY || '',
  CRIMINALIP_API_KEY: process.env.CRIMINALIP_API_KEY || '',
  VIEWDNS_API_KEY: process.env.VIEWDNS_API_KEY || '',
  ZOOMEYE_API_KEY: process.env.ZOOMEYE_API_KEY || '',
  URLSCAN_API_KEY: process.env.URLSCAN_API_KEY || '',
  VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY || '',
  HYBRID_ANALYSIS_API_KEY: process.env.HYBRID_ANALYSIS_API_KEY || '',

  // Free TI additions
  NVD_API_KEY: process.env.NVD_API_KEY || '',

  // Continuous scanning (minutes between scheduler checks; per-org interval in monitoring config)
  SCAN_INTERVAL_MINUTES: parseInt(process.env.SCAN_INTERVAL_MINUTES || '15', 10),
  SCAN_POLL_MS: parseInt(process.env.SCAN_POLL_MS || '60000', 10),
  CLIENT_POLL_MS: parseInt(process.env.CLIENT_POLL_MS || '90000', 10),
};

export default env;
