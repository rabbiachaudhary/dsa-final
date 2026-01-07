require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testNativeConnection() {
  const uri = process.env.MONGO_URI;
  
  if (!uri) {
    console.error('❌ MONGO_URI not set');
    process.exit(1);
  }

  console.log('🔍 Testing with native MongoDB driver...');
  console.log('Connection string (masked):', uri.replace(/:[^:@]+@/, ':****@'));
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    tls: true,
    // Allow invalid certificates for testing (system clock issue)
    tlsAllowInvalidCertificates: true,
  });

  try {
    console.log('\n⏳ Attempting connection...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test a simple operation
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('✅ Database accessible!');
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('\n✅ Native driver test successful!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed!');
      console.error('   Check your username and password in MongoDB Atlas');
      console.error('   Go to: Database Access → Edit user → Reset password if needed');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 DNS resolution failed');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
      console.error('\n💡 Connection timeout');
      console.error('   This could be:');
      console.error('   1. Antivirus blocking TLS/SSL connections');
      console.error('   2. Corporate firewall/proxy');
      console.error('   3. VPN interfering');
    }
    
    process.exit(1);
  }
}

testNativeConnection();
