/**
 * ShadowNet AI — Seed Script
 * Creates ONLY the analyst user account and organization.
 * NO demo/fake assets, credentials, attack paths, or alerts.
 * All data must come from real live API investigations.
 */
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

    // Clear ALL existing data (clean slate)
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
    console.log('[SEED] Cleared all existing data');

    // Create organization
    const org = await Organization.create({
      name: 'ShadowNet AI Inc.',
      industry: 'Technology',
      size: 250,
      api_quota: 10000,
      subscription_tier: 'enterprise',
    });
    console.log('[SEED] Created organization:', org.name);

    // Create analyst user (the ONLY seeded entity)
    const passwordHash = await bcrypt.hash('ShadowNet2026!', 12);
    await User.create({
      email: 'analyst@shadownet.ai',
      password_hash: passwordHash,
      full_name: 'Alex Security',
      organization_id: org._id,
      role: 'admin',
    });
    console.log('[SEED] Created analyst user: analyst@shadownet.ai');

    // Create empty monitoring config with real TI sources enabled
    await MonitoringConfig.create({
      organization_id: org._id,
      monitoring_enabled: true,
      scan_interval: 0.25,       // 15 minutes
      scan_interval_hours: 0.25,
      ti_sources_enabled: [
        'alienvault', 'abuseipdb', 'virustotal', 'criminalip',
        'crtsh', 'dnsenum', 'urlscan', 'nvd', 'ripestat',
        'hybridanalysis', 'viewdns', 'zoomeye',
      ],
      alert_rules: [],
      scan_targets: [],
    });
    console.log('[SEED] Created empty monitoring config');

    console.log('\n[SEED] ✅ Database seeded successfully!');
    console.log('[SEED] ───────────────────────────────────────');
    console.log('[SEED] Login: analyst@shadownet.ai / ShadowNet2026!');
    console.log('[SEED] NO demo data seeded. All intelligence comes from live APIs.');
    console.log('[SEED] Start by searching an IP or domain in the header search bar.');
    console.log('[SEED] ───────────────────────────────────────\n');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exit(1);
  }
}

seed();
