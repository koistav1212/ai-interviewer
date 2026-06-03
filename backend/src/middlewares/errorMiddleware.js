module.exports = (err, req, res, next) => {
  console.error('API Error: ', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    timestamp: new Date()
  });

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
    }
  });
};
