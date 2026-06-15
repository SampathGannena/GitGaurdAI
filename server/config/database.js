const mongoose = require('mongoose');
const logger = require('./logger');

let listenersRegistered = false;

function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected; waiting for driver reconnect');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message || err}`);
  });
}

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  registerConnectionListeners();

  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });
}

module.exports = { connectDatabase };
