import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, enum: ['create', 'read', 'update', 'delete', 'export', 'remediate', 'acknowledge', 'login', 'logout', 'register'], required: true },
  resource_type: { type: String, default: '' },
  resource_id: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  ip_address: { type: String, default: '' },
  user_agent: { type: String, default: '' },
  changes: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  error_message: { type: String, default: '' },
});

auditLogSchema.index({ organization_id: 1, timestamp: -1 });
auditLogSchema.index({ user_id: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
