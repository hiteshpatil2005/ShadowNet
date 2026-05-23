import { v4 as uuidv4 } from 'uuid';

const errorHandler = (err, req, res, next) => {
  const requestId = uuidv4();
  
  console.error(`[ERROR] ${requestId}:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      status: 'error',
      error_code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      details: messages,
      request_id: requestId,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      error_code: 'DUPLICATE_ENTRY',
      message: 'A resource with that identifier already exists.',
      request_id: requestId,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      error_code: 'INVALID_ID',
      message: 'Invalid resource identifier format.',
      request_id: requestId,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    error_code: err.errorCode || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred.',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    request_id: requestId,
  });
};

export default errorHandler;
