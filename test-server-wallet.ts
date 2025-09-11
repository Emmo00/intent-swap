// Test script for server wallet API
// Run with: npx tsx test-server-wallet.ts

import "dotenv/config";

async function testServerWallet() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🧪 Testing Server Wallet API...\n')
  
  try {
    // Test POST /api/wallet/create
    console.log('1. Testing POST /api/wallet/create')
    const createResponse = await fetch(`${baseUrl}/api/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!createResponse.ok) {
      throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`)
    }
    
    const createResult = await createResponse.json()
    console.log('✅ Create wallet response:', createResult)
    console.log()
    
    // Test GET /api/wallet/create
    console.log('2. Testing GET /api/wallet/create')
    const getResponse = await fetch(`${baseUrl}/api/wallet/create`, {
      method: 'GET',
    })
    
    if (!getResponse.ok) {
      throw new Error(`HTTP ${getResponse.status}: ${getResponse.statusText}`)
    }
    
    const getResult = await getResponse.json()
    console.log('✅ Get wallet response:', getResult)
    console.log()
    
    // Test GET /api/wallet/server
    console.log('3. Testing GET /api/wallet/server')
    const serverResponse = await fetch(`${baseUrl}/api/wallet/server`, {
      method: 'GET',
    })
    
    if (!serverResponse.ok) {
      throw new Error(`HTTP ${serverResponse.status}: ${serverResponse.statusText}`)
    }
    
    const serverResult = await serverResponse.json()
    console.log('✅ Server wallet response:', serverResult)
    console.log()
    
    // Verify addresses match
    if (createResult.serverWalletAddress === getResult.serverWalletAddress && 
        getResult.serverWalletAddress === serverResult.wallet.address) {
      console.log('🎉 All endpoints return consistent wallet addresses!')
      console.log('📍 Server Wallet Address:', createResult.serverWalletAddress)
      console.log('🔒 Smart Account Address:', createResult.smartAccountAddress || 'N/A')
    } else {
      console.log('⚠️  Warning: Wallet addresses are inconsistent across endpoints')
    }
    
  } catch (error) {
    console.error('❌ Server wallet test failed:', error)
    console.log('\n💡 Make sure the development server is running: pnpm dev')
    console.log('   And ensure CDP credentials are configured in .env.local')
  }
}

testServerWallet()
