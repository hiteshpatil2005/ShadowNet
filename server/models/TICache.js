import mongoose from 'mongoose';

const tiCacheSchema = new mongoose.Schema({
  query_type:     { type: String, required: true },  // ip, domain, url, hash, cve, email
  query_value:    { type: String, required: true },
  source:         { type: String, required: true },  // 'orchestrator' or adapter name
  indicator_type: { type: String, enum: ['ip', 'domain', 'url', 'hash', 'cve', 'email', null], default: null },
  result:         { type: mongoose.Schema.Types.Mixed, default: {} },
  cached_at:      { type: Date, default: Date.now },
  expires_at:     { type: Date, required: true },    // 30 minutes from cached_at
  hit_count:      { type: Number, default: 0 },
});

tiCacheSchema.index({ query_type: 1, query_value: 1, source: 1 }, { unique: true });
tiCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // MongoDB auto-deletes after TTL

export default mongoose.model('TICache', tiCacheSchema);
