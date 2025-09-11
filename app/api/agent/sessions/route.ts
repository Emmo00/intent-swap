import { NextRequest, NextResponse } from 'next/server'
import { chatDatabase } from '@/lib/database'

// GET endpoint to retrieve all chat sessions for the authenticated user
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

    // Get all sessions for the user
    const sessions = await chatDatabase.getAllSessions(userAddress)
    
    // Transform sessions to include summary info
    const sessionSummaries = sessions.map(session => {
      const lastMessage = session.messages[session.messages.length - 1]
      const userMessages = session.messages.filter(m => m.role === 'user')
      const firstUserMessage = userMessages[0]
      
      return {
        sessionId: session.sessionId,
        title: firstUserMessage?.content.slice(0, 50) || 'New conversation',
        lastMessage: lastMessage?.content.slice(0, 100) || '',
        messageCount: session.messages.length,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        preview: firstUserMessage?.content.slice(0, 100) || 'New conversation'
      }
    })

    return NextResponse.json({
      success: true,
      sessions: sessionSummaries,
      totalSessions: sessionSummaries.length
    })

  } catch (error) {
    console.error('❌ Sessions API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
