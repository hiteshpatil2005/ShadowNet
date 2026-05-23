import mongoose from 'mongoose';

const tiCacheSchema = new mongoose.Schema({
  query_type: { type: String, required: true },
  query_value: { type: String, required: true },
  source: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, default: {} },
  cached_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true },
  hit_count: { type: Number, default: 0 },
});

tiCacheSchema.index({ query_type: 1, query_value: 1, source: 1 }, { unique: true });
tiCacheSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('TICache', tiCacheSchema);
