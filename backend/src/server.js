require('dotenv').config();

// Polyfill process.getBuiltinModule for Node versions older than v20.16.0
if (typeof process.getBuiltinModule !== 'function') {
  process.getBuiltinModule = function (name) {
    return require(name);
  };
}

const app = require('./app');

const PORT = process.env.PORT || 8001;

const server = app.listen(PORT, () => {
  console.log(`🚀 TalentIQ AI Backend server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
