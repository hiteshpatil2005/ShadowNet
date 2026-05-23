import mongoose from 'mongoose';

const digitalAssetSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  asset_type: { type: String, enum: ['domain', 'subdomain', 'ip', 'service', 'certificate', 'api_endpoint', 'cloud_resource', 'credential'], required: true },
  asset_value: { type: String, required: true },
  ip: { type: String },
  ports: [{ type: Number }],
  cloud_provider: { type: String },
  services: { type: String },
  first_discovered: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now },
  exposure_type: { type: String, enum: ['public', 'indexed_search', 'leaked', 'vulnerable'], default: 'public' },
  risk_level: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  risk_score: { type: Number, default: 0, min: 0, max: 100 },
  sources: [{ type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  tags: [{ type: String }],
  is_confirmed: { type: Boolean, default: false },
  remediation_status: { type: String, enum: ['not_started', 'in_progress', 'remediated', 'false_positive'], default: 'not_started' },
  notes: { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

digitalAssetSchema.index({ organization_id: 1 });
digitalAssetSchema.index({ asset_type: 1 });
digitalAssetSchema.index({ risk_level: 1 });
digitalAssetSchema.index({ asset_value: 'text' });

export default mongoose.model('DigitalAsset', digitalAssetSchema);
