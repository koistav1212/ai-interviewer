const express = require('express');
const cors = require('cors');
const { mongoose } = require('./models');
const masterRouter = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const loggerMiddleware = require('./middlewares/loggerMiddleware');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState >= 1;
    if (!isConnected) throw new Error('MongoDB connection is not ready');
    res.status(200).json({ status: 'OK', database: 'CONNECTED', env: process.env.NODE_ENV });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'DISCONNECTED', message: error.message });
  }
});

// Mount master API router under /
app.use('/', masterRouter);

// Centralized error handling
app.use(errorMiddleware);

module.exports = app;
