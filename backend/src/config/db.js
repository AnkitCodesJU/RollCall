const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google/Cloudflare DNS to fix "querySrv ECONNREFUSED" bugs with ISPs
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4, // Force IPv4 to bypass Node.js SRV DNS resolution bugs
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
