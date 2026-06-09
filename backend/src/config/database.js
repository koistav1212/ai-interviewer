require('dotenv').config();
const mongoose = require('mongoose');

const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://koustavkanakapd_db_user:abcd1234@cluster0.bw8wig2.mongodb.net/';

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;
    
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = {
  mongoUrl,
  connectDB,
};
