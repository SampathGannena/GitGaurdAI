const mongoose = require('mongoose');
const logger = require('./logger');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });

  logger.info('MongoDB connected');
}

module.exports = { connectDatabase };
