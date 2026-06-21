import mongoose from 'mongoose';

const correlationSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  asset_id_1: { type: String },
  asset_id_2: { type: String },
  service: { type: String },
  cve: { type: String },
  credential: { type: String },
  ip_address: { type: String },
  indicator_id: { type: mongoose.Schema.Types.Mixed }, // ref to Investigation _id
  correlation_type: {
    type: String,
    enum: [
      'credential_usage',
      'certificate_reuse',
      'ip_hosting',
      'domain_resolution',
      'suspicious_relationship',
      'ti_confirmed_threat',       // NEW: TI source confirms malicious
      'vt_detection',              // NEW: VirusTotal multi-engine detection
      'malicious_domain_credential', // NEW: malicious domain + leaked creds
    ],
    default: 'suspicious_relationship',
  },
  risk_score: { type: Number, default: 0, min: 0, max: 100 },
  confidence: { type: String, default: '0%' },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  description: { type: String, default: '' },
  explanation: { type: String, default: '' },
  impact: { type: String, default: '' },
  evidence: { type: mongoose.Schema.Types.Mixed, default: {} },
  sources_data: { type: mongoose.Schema.Types.Mixed, default: {} }, // raw TI evidence
  attack_scenarios: [{ type: String }],
  mitre_techniques: [{ type: String }],
  remediation_priority: { type: String, enum: ['Immediate', 'High', 'Medium', 'Low'], default: 'Medium' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

correlationSchema.index({ organization_id: 1 });
correlationSchema.index({ risk_score: -1 });
correlationSchema.index({ correlation_type: 1 });
correlationSchema.index({ severity: 1 });

export default mongoose.model('Correlation', correlationSchema);

