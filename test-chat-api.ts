// Test script for the chat API endpoint
// Run with: npx tsx test-chat-api.ts

import 'dotenv/config'

const API_BASE = 'http://localhost:3001/api/agent/chat'
const SESSION_ID = `test-session-${Date.now()}`

async function testChatAPI() {
  console.log('🧪 Testing Chat API')
  console.log(`📝 Using session ID: ${SESSION_ID}`)

  try {
    // Test 1: Send a user message
    console.log('\n1️⃣ Sending user message...')
    const userResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        role: 'user',
        message: 'I want to swap 0.1 ETH for USDC'
      }),
    })

    if (!userResponse.ok) {
      throw new Error(`HTTP error! status: ${userResponse.status}`)
    }

    const userResult = await userResponse.json()
    console.log('✅ User message response:', JSON.stringify(userResult, null, 2))

    // Test 2: Get chat history
    console.log('\n2️⃣ Retrieving chat history...')
    const historyResponse = await fetch(`${API_BASE}?sessionId=${SESSION_ID}`)
    
    if (!historyResponse.ok) {
      throw new Error(`HTTP error! status: ${historyResponse.status}`)
    }

    const historyResult = await historyResponse.json()
    console.log('✅ Chat history:', JSON.stringify(historyResult, null, 2))

    // Test 3: Send another user message
    console.log('\n3️⃣ Sending follow-up message...')
    const followUpResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        role: 'user',
        message: 'What will be the estimated gas cost?'
      }),
    })

    if (!followUpResponse.ok) {
      throw new Error(`HTTP error! status: ${followUpResponse.status}`)
    }

    const followUpResult = await followUpResponse.json()
    console.log('✅ Follow-up response:', JSON.stringify(followUpResult, null, 2))

    // Test 4: Test invalid request
    console.log('\n4️⃣ Testing invalid request...')
    const invalidResponse = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        role: 'invalid_role',
        message: 'This should fail'
      }),
    })

    const invalidResult = await invalidResponse.json()
    console.log('❌ Expected error response:', JSON.stringify(invalidResult, null, 2))

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testChatAPI().then(() => {
  console.log('\n🏁 Test completed')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Test crashed:', error)
  process.exit(1)
})
