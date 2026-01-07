require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not set in .env file');
      process.exit(1);
    }
    
    // Check for hidden characters
    const uri = process.env.MONGO_URI.trim();
    console.log('Connection string length:', uri.length);
    console.log('Connection string (masked):', uri.replace(/:[^:@]+@/, ':****@'));
    console.log('Starts with mongodb+srv:', uri.startsWith('mongodb+srv://'));
    
    // Try connecting with extended options
    console.log('\n⏳ Attempting connection (this may take up to 30 seconds)...');
    
    // Enable mongoose debug to see what's happening
    mongoose.set('debug', true);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority',
      // Try without explicit TLS - mongodb+srv:// handles it automatically
    });
    
    console.log('\n✅ Successfully connected to MongoDB!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Ready state:', mongoose.connection.readyState);
    
    await mongoose.disconnect();
    console.log('\n✅ Connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('\n📋 IP Whitelist Issue:');
      console.error('   Your IP whitelist shows 0.0.0.0/0 is active.');
      console.error('   Possible causes:');
      console.error('   1. Windows Firewall blocking outbound connections');
      console.error('   2. Antivirus software blocking');
      console.error('   3. VPN or proxy interfering');
      console.error('   4. Network restrictions');
    } else if (error.message.includes('authentication')) {
      console.error('\n📋 Authentication Issue:');
      console.error('   Check username and password in connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('DNS')) {
      console.error('\n📋 DNS/Network Issue:');
      console.error('   Cannot resolve MongoDB Atlas hostname');
      console.error('   Check internet connection and DNS settings');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();

