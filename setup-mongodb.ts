// MongoDB setup script using Mongoose
// Run with: npx tsx setup-mongodb.ts

import { connectToDatabase, chatDatabase } from './lib/database'

async function setupMongoDB() {
  console.log('🔧 Setting up MongoDB with Mongoose...')
  
  try {
    // Test connection
    await connectToDatabase()
    console.log('✅ Successfully connected to MongoDB via Mongoose')
    
    // Test basic operations
    console.log('🧪 Testing database operations...')
    
    // Create a test session
    const testSessionId = `test-setup-${Date.now()}`
    const session = await chatDatabase.createSession(testSessionId, 'test-user')
    console.log('✅ Created test session:', session.sessionId)
    
    // Add a test message
    await chatDatabase.addMessage(testSessionId, {
      role: 'user',
      content: 'Hello, this is a test message'
    })
    console.log('✅ Added test message')
    
    // Retrieve messages
    const messages = await chatDatabase.getMessages(testSessionId)
    console.log('✅ Retrieved messages:', messages.length)
    
    // Get session stats
    const stats = await chatDatabase.getSessionStats(testSessionId)
    console.log('✅ Session stats:', stats)
    
    // Clean up test session
    await chatDatabase.deleteSession(testSessionId)
    console.log('✅ Cleaned up test session')
    
    console.log('🎉 MongoDB setup completed successfully!')
    
  } catch (error) {
    console.error('❌ MongoDB setup failed:', error)
    console.log('\n💡 Make sure MongoDB is running on mongodb://localhost:27017')
    console.log('   You can start it with: mongod --dbpath /path/to/your/db')
    process.exit(1)
  }
  
  process.exit(0)
}

setupMongoDB()
