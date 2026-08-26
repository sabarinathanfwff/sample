const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details.map(detail => detail.message),
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Resource already exists',
      message: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Invalid reference',
      message: 'Referenced resource does not exist',
    });
  }

  if (err.code === '22P02') {
    return res.status(400).json({
      error: 'Invalid input format',
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  logger.warn('Route not found:', { path: req.path, method: req.method });
  res.status(404).json({ error: 'Route not found' });
};

module.exports = {
  errorHandler,
  notFound,
};
