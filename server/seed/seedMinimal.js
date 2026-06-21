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

    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      DigitalAsset.deleteMany({}),
      LeakedCredential.deleteMany({}),
      Correlation.deleteMany({}),
      AttackPath.deleteMany({}),
      ThreatPersona.deleteMany({}),
      ExposureEvent.deleteMany({}),
      MonitoringConfig.deleteMany({}),
    ]);
    console.log('[SEED] Cleared existing data');

    const org = await Organization.create({
      name: 'My Organization',
      industry: 'Technology',
      size: 50,
      api_quota: 10000,
      subscription_tier: 'enterprise',
    });

    const passwordHash = await bcrypt.hash('ShadowNet2026!', 12);
    await User.create({
      email: 'analyst@shadownet.ai',
      password_hash: passwordHash,
      full_name: 'Security Analyst',
      organization_id: org._id,
      role: 'admin',
    });

    await MonitoringConfig.create({
      organization_id: org._id,
      monitoring_enabled: true,
      scan_interval_hours: 1,
      scan_targets: [],
      ti_sources_enabled: ['alienvault', 'abuseipdb', 'virustotal', 'crtsh', 'urlscan', 'nvd', 'ripestat', 'abusech'],
      alert_rules: [],
    });

    console.log('\n[SEED] ✅ Minimal seed complete (no fake assets).');
    console.log('[SEED] Login: analyst@shadownet.ai / ShadowNet2026!');
    console.log('[SEED] Add scan targets under Monitoring, or search an IP/domain in the header.\n');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exit(1);
  }
}

seed();
