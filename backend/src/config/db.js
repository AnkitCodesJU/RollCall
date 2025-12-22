const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Do NOT exit process in serverless envs, just throw error so Vercel logs it
    throw error;
  }
};

module.exports = connectDB;
