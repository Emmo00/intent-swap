import { NextRequest, NextResponse } from 'next/server'
import { chatDatabase } from '@/lib/database'
import { generateChatResponse } from '@/lib/ai'
import type { ChatMessage } from '@/types'

interface ChatRequest {
  sessionId: string
  role: 'user' | 'model' | 'system'
  message: string
}

export async function POST(request: NextRequest) {
  try {
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

    // Get or create session
    let session = await chatDatabase.getSession(sessionId)
    if (!session) {
      console.log(`🆕 Creating new chat session: ${sessionId}`)
      session = await chatDatabase.createSession(sessionId)
    }


    if (role === 'model' || role === 'system') {
      // Pass model/system message along with chat history, store and return the response
      try {
        // Get current conversation history
        const messages = await chatDatabase.getMessages(sessionId);
        // Convert 'system' to 'model' for agent, but keep original for storage
        const agentMessages: ChatMessage[] = messages.map((msg) =>
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
          aiResponseText = aiResponse.toString();
        }
        if (!aiResponseText) {
          throw new Error('No valid response text found in AI response');
        }
        // Create AI message
        const aiMessage: ChatMessage = {
          role: 'model',
          content: aiResponseText
        };
        // Store the original message (model/system) in database
        await chatDatabase.addMessage(sessionId, { role, content: message });
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
      // Create the new message
      const newMessage: ChatMessage = {
        role,
        content: message
      };
      // Store the user/system/model message in database
      await chatDatabase.addMessage(sessionId, newMessage);
      console.log(`💬 Stored ${role} message for session ${sessionId}`);
      // Get current conversation history
      const messages = await chatDatabase.getMessages(sessionId);
      let aiResponse = null;
      let aiMessage: ChatMessage | null = null;
      // Only generate AI response if the message is from user
      if (role === 'user') {
        console.log(`🤖 Generating AI response for session ${sessionId}`);
        try {
          // Convert all 'system' messages to 'model' before passing to agent
          const agentMessages: ChatMessage[] = messages.map((msg) =>
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
