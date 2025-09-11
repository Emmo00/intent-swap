import { NextRequest, NextResponse } from 'next/server'
import { chatDatabase } from '@/lib/database'
import { generateChatResponse } from '@/lib/ai'
import type { ChatMessage } from '@/types'

interface ChatRequest {
  sessionId: string
  role: 'user' | 'model'
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
    if (!['user', 'model'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "model"' },
        { status: 400 }
      )
    }

    // Get or create session
    let session = await chatDatabase.getSession(sessionId)
    if (!session) {
      console.log(`🆕 Creating new chat session: ${sessionId}`)
      session = await chatDatabase.createSession(sessionId)
    }

    // Create the new message
    const newMessage: ChatMessage = {
      role,
      content: message
    }

    // Store the user/model message in database
    await chatDatabase.addMessage(sessionId, newMessage)
    console.log(`💬 Stored ${role} message for session ${sessionId}`)

    // Get current conversation history
    const messages = await chatDatabase.getMessages(sessionId)

    let aiResponse = null
    let aiMessage: ChatMessage | null = null

    // Only generate AI response if the message is from user
    if (role === 'user') {
      console.log(`🤖 Generating AI response for session ${sessionId}`)
      
      try {
        // Generate AI response using the chat history
        aiResponse = await generateChatResponse(messages)
        
        // Extract AI response text from Gemini response format
        let aiResponseText = ''
        
        if (aiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
          // Google Gemini format
          aiResponseText = aiResponse.candidates[0].content.parts[0].text
        } else if (aiResponse.text) {
          // Direct text response
          aiResponseText = aiResponse.text
        } else {
          // Try to get text from the response object
          aiResponseText = aiResponse.toString()
        }

        if (!aiResponseText) {
          throw new Error('No valid response text found in AI response')
        }

        // Create AI message
        aiMessage = {
          role: 'model',
          content: aiResponseText
        }

        // Store AI response in database
        await chatDatabase.addMessage(sessionId, aiMessage)
        console.log(`✅ Stored AI response for session ${sessionId}`)
        
      } catch (aiError) {
        console.error('❌ AI generation error:', aiError)
        // Return user message anyway, but indicate AI error
        return NextResponse.json({
          success: true,
          sessionId,
          userMessage: newMessage,
          aiResponse: null,
          error: 'Failed to generate AI response'
        })
      }
    }

    // Return response
    const response = {
      success: true,
      sessionId,
      message: newMessage,
      ...(aiMessage && { aiResponse: aiMessage }),
      ...(aiResponse && { rawAiResponse: aiResponse })
    }

    return NextResponse.json(response)

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
