import { NextRequest, NextResponse } from 'next/server'
import { chatDatabase } from '@/lib/database'
import { generateChatResponse } from '@/lib/ai'
import type { ChatMessage } from '@/types'

// Configuration: Number of recent messages to send to AI (0 = send all)
const MAX_CONTEXT_MESSAGES: number = 8

interface ChatRequest {
  sessionId: string
  role: 'user' | 'model' | 'system'
  message: string
}

// Helper function to get recent messages for AI context
function getRecentMessages(messages: ChatMessage[]): ChatMessage[] {
  if (MAX_CONTEXT_MESSAGES === 0 || messages.length <= MAX_CONTEXT_MESSAGES) {
    return messages
  }
  
  // Get the most recent messages
  return messages.slice(-MAX_CONTEXT_MESSAGES)
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Decode session to get user address
    const sessionData = Buffer.from(sessionCookie.value, 'base64').toString()
    const [userAddress, timestamp] = sessionData.split(':')
    
    // Check if session is still valid (7 days)
    const sessionAge = Date.now() - parseInt(timestamp)
    const maxAge = 60 * 60 * 24 * 7 * 1000 // 7 days in milliseconds
    
    if (sessionAge > maxAge) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: ChatRequest = await request.json()
    const { sessionId, role, message } = body

    // Validate required fields
    if (!sessionId || !role || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, role, message' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['user', 'model', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user", "model", or "system"' },
        { status: 400 }
      )
    }

    // Get or create session (now tied to user)
    let session = await chatDatabase.getSession(sessionId)
    if (!session) {
      console.log(`🆕 Creating new chat session: ${sessionId} for user: ${userAddress}`)
      session = await chatDatabase.createSession(sessionId, userAddress)
    } else {
      // Verify session belongs to the authenticated user
      if (session.userId !== userAddress) {
        return NextResponse.json(
          { error: 'Access denied to this chat session' },
          { status: 403 }
        )
      }
    }


    if (role === 'model' || role === 'system') {
      // Pass model/system message along with chat history, store and return the response
      try {
        // Get current conversation history
        const messages = await chatDatabase.getMessages(sessionId);
        // Get recent messages for AI context
        const recentMessages = getRecentMessages(messages);
        console.log(`🧠 Using ${recentMessages.length} out of ${messages.length} messages for AI context`);
        
        // Convert 'system' to 'model' for agent, but keep original for storage
        const agentMessages: ChatMessage[] = recentMessages.map((msg) =>
          msg.role === 'system' ? { ...msg, role: 'model' } : msg
        );
        // Add the new message as 'model' for agent
        agentMessages.push({ role: 'model', content: message });
        const aiResponse = await generateChatResponse(agentMessages);
        let aiResponseText = '';
        if (aiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiResponseText = aiResponse.candidates[0].content.parts[0].text;
        } else if (aiResponse.text) {
          aiResponseText = aiResponse.text;
        } else {
          aiResponseText = JSON.stringify(aiResponse);
        }
        if (!aiResponseText) {
          throw new Error('No valid response text found in AI response');
        }
        // Create AI message
        const aiMessage: ChatMessage = {
          role: 'model',
          content: aiResponseText
        };
        // Store the original message (convert system to model for database)
        const messageToStore: ChatMessage = {
          role: role === 'system' ? 'model' as const : role as 'user' | 'model',
          content: message
        };
        await chatDatabase.addMessage(sessionId, messageToStore);
        // Store AI response in database
        await chatDatabase.addMessage(sessionId, aiMessage);
        console.log(`✅ Stored AI response for session ${sessionId}`);
        // Extract function calls if present
        const functionCalls: any[] = [];
        if (aiResponse.candidates) {
          aiResponse.candidates.forEach((candidate: any) => {
            if (candidate.content?.parts) {
              candidate.content.parts.forEach((part: any) => {
                if (part.functionCall) {
                  functionCalls.push(part.functionCall);
                }
              });
            }
            if (candidate.functionCalls) {
              candidate.functionCalls.forEach((call: any) => {
                functionCalls.push(call);
              });
            }
          });
        }
        return NextResponse.json({
          success: true,
          sessionId,
          aiResponse: aiMessage,
          rawAiResponse: aiResponse,
          ...(functionCalls.length > 0 ? { functionCalls } : {})
        });
      } catch (aiError) {
        console.error('❌ AI generation error:', aiError);
        return NextResponse.json({
          success: false,
          sessionId,
          aiResponse: null,
          error: 'Failed to generate AI response'
        });
      }
    } else {
      // Create the new message (convert system to model for database)
      const newMessage: ChatMessage = {
        role: (role as string) === 'system' ? 'model' as const : role as 'user' | 'model',
        content: message
      };
      // Store the user/model message in database
      await chatDatabase.addMessage(sessionId, newMessage);
      console.log(`💬 Stored ${newMessage.role} message for session ${sessionId}`);
      // Get current conversation history
      const messages = await chatDatabase.getMessages(sessionId);
      let aiResponse = null;
      let aiMessage: ChatMessage | null = null;
      // Only generate AI response if the message is from user
      if (role === 'user') {
        console.log(`🤖 Generating AI response for session ${sessionId}`);
        try {
          // Get recent messages for AI context
          const recentMessages = getRecentMessages(messages);
          console.log(`🧠 Using ${recentMessages.length} out of ${messages.length} messages for AI context`);
          
          // Convert all 'system' messages to 'model' before passing to agent
          const agentMessages: ChatMessage[] = recentMessages.map((msg) =>
            msg.role === 'system' ? { ...msg, role: 'model' } : msg
          );
          // Generate AI response using the chat history
          aiResponse = await generateChatResponse(agentMessages);
          // Extract AI response text from Gemini response format
          let aiResponseText = '';
          if (aiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
            aiResponseText = aiResponse.candidates[0].content.parts[0].text;
          } else if (aiResponse.text) {
            aiResponseText = aiResponse.text;
          } else {
            aiResponseText = aiResponse.toString();
          }
          if (!aiResponseText) {
            throw new Error('No valid response text found in AI response');
          }
          // Create AI message
          aiMessage = {
            role: 'model',
            content: aiResponseText
          };
          // Store AI response in database
          await chatDatabase.addMessage(sessionId, aiMessage);
          console.log(`✅ Stored AI response for session ${sessionId}`);
          // Extract function calls if present
          const functionCalls: any[] = [];
          if (aiResponse.candidates) {
            aiResponse.candidates.forEach((candidate: any) => {
              if (candidate.content?.parts) {
                candidate.content.parts.forEach((part: any) => {
                  if (part.functionCall) {
                    functionCalls.push(part.functionCall);
                  }
                });
              }
              if (candidate.functionCalls) {
                candidate.functionCalls.forEach((call: any) => {
                  functionCalls.push(call);
                });
              }
            });
          }
          // Return response
          const response = {
            success: true,
            sessionId,
            message: newMessage,
            ...(aiMessage && { aiResponse: aiMessage }),
            ...(aiResponse && { rawAiResponse: aiResponse }),
            ...(functionCalls.length > 0 ? { functionCalls } : {})
          };
          return NextResponse.json(response);
        } catch (aiError) {
          console.error('❌ AI generation error:', aiError);
          // Return user message anyway, but indicate AI error
          return NextResponse.json({
            success: true,
            sessionId,
            userMessage: newMessage,
            aiResponse: null,
            error: 'Failed to generate AI response'
          });
        }
      }
      // Return response (no AI response for non-user messages)
      const response = {
        success: true,
        sessionId,
        message: newMessage
      };
      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('❌ Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve chat history
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Decode session to get user address
    const sessionData = Buffer.from(sessionCookie.value, 'base64').toString()
    const [userAddress, timestamp] = sessionData.split(':')
    
    // Check if session is still valid
    const sessionAge = Date.now() - parseInt(timestamp)
    const maxAge = 60 * 60 * 24 * 7 * 1000 // 7 days in milliseconds
    
    if (sessionAge > maxAge) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    // Get session
    const session = await chatDatabase.getSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify session belongs to the authenticated user
    if (session.userId !== userAddress) {
      return NextResponse.json(
        { error: 'Access denied to this chat session' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length
    })

  } catch (error) {
    console.error('❌ Chat history API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE endpoint to delete a chat session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    const deleted = await chatDatabase.deleteSession(sessionId)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete session API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
