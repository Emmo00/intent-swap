import "dotenv/config";

async function testChatIntegration() {
  console.log("🧪 Testing Chat API Integration");
  
  const sessionId = `test_session_${Date.now()}`;
  const baseUrl = "http://localhost:3001";
  
  try {
    // Test 1: Send a user message
    console.log("\n1️⃣ Testing user message...");
    const userResponse = await fetch(`${baseUrl}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        role: 'user',
        message: 'I want to swap 0.1 ETH for USDC'
      }),
    });
    
    if (!userResponse.ok) {
      throw new Error(`User message failed: ${userResponse.statusText}`);
    }
    
    const userData = await userResponse.json();
    console.log("✅ User message response:", {
      success: userData.success,
      hasAiResponse: !!userData.aiResponse,
      hasFunctionCalls: !!(userData.functionCalls && userData.functionCalls.length > 0)
    });
    
    if (userData.functionCalls) {
      console.log("🔧 Function calls received:", userData.functionCalls.map((call: any) => call.name));
    }
    
    // Test 2: Send a system message (function results)
    if (userData.functionCalls && userData.functionCalls.length > 0) {
      console.log("\n2️⃣ Testing system message with function results...");
      const systemResponse = await fetch(`${baseUrl}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          role: 'system',
          message: 'Function results: swap_tokens executed successfully, transaction hash: 0x123...'
        }),
      });
      
      if (!systemResponse.ok) {
        throw new Error(`System message failed: ${systemResponse.statusText}`);
      }
      
      const systemData = await systemResponse.json();
      console.log("✅ System message response:", {
        success: systemData.success,
        hasAiResponse: !!systemData.aiResponse
      });
    }
    
    // Test 3: Get chat history
    console.log("\n3️⃣ Testing chat history retrieval...");
    const historyResponse = await fetch(`${baseUrl}/api/agent/chat?sessionId=${sessionId}`);
    
    if (!historyResponse.ok) {
      throw new Error(`History retrieval failed: ${historyResponse.statusText}`);
    }
    
    const historyData = await historyResponse.json();
    console.log("✅ Chat history:", {
      success: historyData.success,
      messageCount: historyData.messageCount,
      messages: historyData.messages?.map((msg: any) => ({ role: msg.role, contentLength: msg.content.length }))
    });
    
    console.log("\n🎉 Chat integration test completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Chat integration test failed:", error);
    throw error;
  }
}

// Only run if called directly
if (require.main === module) {
  testChatIntegration()
    .then(() => {
      console.log("\n✨ All tests passed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Test failed:", error);
      process.exit(1);
    });
}

export { testChatIntegration };
