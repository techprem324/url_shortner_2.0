const mongoose = require('mongoose');

let isConnectedOnce = false;

/**
 * Connect to MongoDB with robust event monitoring and error handling.
 * @param {string} url - MongoDB connection URI
 * @returns {Promise<mongoose.Connection>}
 */
async function connectToMongoDB(url) {
  const uri = url || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/url_shortener';

  // Event listeners for connection lifecycle
  mongoose.connection.on('connected', () => {
    isConnectedOnce = true;
    console.log('✅ MongoDB connected successfully to:', mongoose.connection.host);
  });

  mongoose.connection.on('error', (err) => {
    if (isConnectedOnce) {
      console.error('❌ MongoDB runtime error:', err.message);
    }
  });

  mongoose.connection.on('disconnected', () => {
    if (isConnectedOnce) {
      console.warn('⚠️ MongoDB disconnected.');
    }
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected successfully');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
    } catch (e) {
      // ignore
    }
    process.exit(0);
  });

  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}

module.exports = { connectToMongoDB };