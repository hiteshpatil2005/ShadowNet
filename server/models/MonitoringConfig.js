import mongoose from 'mongoose';

const alertRuleSchema = new mongoose.Schema({
  keyword: { type: String, required: true },
  type: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { _id: true });

const monitoringConfigSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  monitoring_enabled: { type: Boolean, default: true },
  scan_interval: { type: Number, default: 24 },
  ti_sources_enabled: [{ type: String }],
  alert_rules: [alertRuleSchema],
  notification_channels: {
    slack: { type: Boolean, default: true },
    teams: { type: Boolean, default: false },
    email: { type: Boolean, default: true },
  },
  notification_preferences: {
    severity_levels: [{ type: String }],
  },
  exclusion_list: [{ type: String }],
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('MonitoringConfig', monitoringConfigSchema);
