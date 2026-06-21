/**
 * ShadowNet AI — Investigation Model
 * Stores results of universal searches (URL, hash, CVE, email, IP, domain).
 */
import mongoose from 'mongoose';

const investigationSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  indicator: { type: String, required: true, trim: true },
  indicator_type: {
    type: String,
    enum: ['ip', 'domain', 'url', 'hash', 'cve', 'email'],
    required: true,
  },
  hash_type: { type: String, enum: ['md5', 'sha1', 'sha256', null], default: null },

  // Verdict computed from API results
  verdict: {
    type: String,
    enum: ['malicious', 'suspicious', 'clean', 'unknown'],
    default: 'unknown',
  },
  risk_score: { type: Number, default: 0, min: 0, max: 100 },

  // Raw API results — only fields that came back with real data
  sources: {
    virustotal: { type: mongoose.Schema.Types.Mixed, default: null },
    abuseipdb: { type: mongoose.Schema.Types.Mixed, default: null },
    alienvault: { type: mongoose.Schema.Types.Mixed, default: null },
    criminalip: { type: mongoose.Schema.Types.Mixed, default: null },
    hybridanalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    urlscan: { type: mongoose.Schema.Types.Mixed, default: null },
    nvd: { type: mongoose.Schema.Types.Mixed, default: null },
    ripestat: { type: mongoose.Schema.Types.Mixed, default: null },
    crtsh: { type: mongoose.Schema.Types.Mixed, default: null },
    dnsenum: { type: mongoose.Schema.Types.Mixed, default: null },
    openphish: { type: mongoose.Schema.Types.Mixed, default: null },
    phishtank: { type: mongoose.Schema.Types.Mixed, default: null },
    abusech: { type: mongoose.Schema.Types.Mixed, default: null },
    zoomeye: { type: mongoose.Schema.Types.Mixed, default: null },
    viewdns: { type: mongoose.Schema.Types.Mixed, default: null },
  },

  // Gemini AI analysis of this specific investigation
  ai_analysis: { type: String, default: null },

  // Sources that returned data (non-null)
  active_sources: [{ type: String }],

  // Linked asset if saved to inventory
  linked_asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalAsset', default: null },

  investigated_at: { type: Date, default: Date.now },
  cached_until: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

investigationSchema.index({ organization_id: 1, indicator: 1 });
investigationSchema.index({ organization_id: 1, indicator_type: 1 });
investigationSchema.index({ organization_id: 1, investigated_at: -1 });
investigationSchema.index({ indicator: 'text' });

export default mongoose.model('Investigation', investigationSchema);
