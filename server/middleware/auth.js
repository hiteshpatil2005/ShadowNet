import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', error_code: 'NO_TOKEN', message: 'Authentication required. Please provide a valid token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password_hash -refresh_token');
    if (!user || !user.is_active) {
      return res.status(401).json({ status: 'error', error_code: 'INVALID_USER', message: 'User not found or deactivated.' });
    }

    req.user = user;
    req.organizationId = user.organization_id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'error', error_code: 'TOKEN_EXPIRED', message: 'Token has expired. Please refresh.' });
    }
    return res.status(401).json({ status: 'error', error_code: 'INVALID_TOKEN', message: 'Invalid authentication token.' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', error_code: 'NOT_AUTHENTICATED', message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', error_code: 'FORBIDDEN', message: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
};
