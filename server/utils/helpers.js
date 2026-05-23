export const createError = (statusCode, errorCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorCode = errorCode;
  return error;
};

export const paginateQuery = (query, { page = 1, limit = 50 }) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  return query.skip(skip).limit(Math.min(parseInt(limit), 1000));
};

export const buildPaginationMeta = (total, page, limit) => ({
  total,
  page: parseInt(page) || 1,
  limit: parseInt(limit) || 50,
  pages: Math.ceil(total / (parseInt(limit) || 50)),
});

export const maskCredential = (value) => {
  if (!value || value.length < 4) return '****';
  return '*'.repeat(value.length - 4) + value.slice(-4);
};

export const getRiskLevel = (score) => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

export const getSeverityFromRiskScore = (score) => {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
};
