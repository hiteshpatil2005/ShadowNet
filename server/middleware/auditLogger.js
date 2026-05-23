import AuditLog from '../models/AuditLog.js';

const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Capture the original send to log after response
    const originalSend = res.send;
    res.send = function (body) {
      // Log the action asynchronously (don't block response)
      AuditLog.create({
        organization_id: req.organizationId,
        user_id: req.user?._id,
        action,
        resource_type: resourceType,
        resource_id: req.params.id || req.params.asset_id || req.params.credential_id || '',
        ip_address: req.ip || req.connection?.remoteAddress || '',
        user_agent: req.headers['user-agent'] || '',
        status: res.statusCode < 400 ? 'success' : 'failure',
      }).catch(err => console.error('[AUDIT] Log failed:', err.message));

      return originalSend.call(this, body);
    };
    next();
  };
};

export default auditLogger;
