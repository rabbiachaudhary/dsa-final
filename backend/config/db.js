const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Log connection attempt (mask password)
    const maskedUri = process.env.MONGO_URI ? 
      process.env.MONGO_URI.replace(/:[^:@]+@/, ':****@') : 
      'MONGO_URI not set';
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('Connection string:', maskedUri);
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set in environment variables');
    }

    // Allow buffering so operations can queue while connecting
    // mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      // MongoDB Atlas specific options
      retryWrites: true,
      w: 'majority',
      // TLS options - mongodb+srv:// automatically enables TLS
      tls: true,
      // For testing: allow invalid certificates if system clock is wrong
      // Remove this in production!
      tlsAllowInvalidCertificates: true,
    });
    
    console.log(`✅ MongoDB connected successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.db.databaseName}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Full error details:', err);
    
    // Check if servers were discovered but connection failed (firewall issue)
    if (err.reason && err.reason.servers && err.reason.servers.size > 0) {
      console.error('\n🔍 DIAGNOSIS: Servers discovered but connection failed');
      console.error('   This indicates a FIREWALL or NETWORK BLOCKING issue');
      console.error('   MongoDB Atlas servers are reachable via DNS but TCP connections are blocked');
      console.error('\n📋 SOLUTION - Windows Firewall:');
      console.error('   1. Open Windows Security → Firewall & network protection');
      console.error('   2. Click "Allow an app through firewall"');
      console.error('   3. Find "Node.js" in the list');
      console.error('   4. Check both "Private" and "Public" boxes');
      console.error('   5. If Node.js is not listed, click "Change Settings" → "Allow another app"');
      console.error('   6. Browse to: C:\\Program Files\\nodejs\\node.exe');
      console.error('   7. Add it and check both Private and Public');
      console.error('\n   OR temporarily disable firewall to test:');
      console.error('   Windows Security → Firewall → Turn off (temporarily)');
    } else if (err.message.includes('IP') || err.message.includes('whitelist')) {
      console.error('\n💡 IP Whitelist Issue:');
      console.error('   Even though 0.0.0.0/0 is whitelisted, try:');
      console.error('   1. Wait 2-3 more minutes for changes to propagate');
      console.error('   2. Check Windows Firewall settings');
      console.error('   3. Try disabling VPN if active');
    } else if (err.message.includes('authentication')) {
      console.error('\n💡 Authentication Issue:');
      console.error('   Check your username and password in the connection string');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('DNS')) {
      console.error('\n💡 Network/DNS Issue:');
      console.error('   Check your internet connection and DNS settings');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;