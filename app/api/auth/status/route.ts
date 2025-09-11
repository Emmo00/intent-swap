import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false })
    }

    // Decode session
    const sessionData = Buffer.from(sessionCookie.value, 'base64').toString()
    const [address, timestamp] = sessionData.split(':')
    
    // Check if session is still valid (7 days)
    const sessionAge = Date.now() - parseInt(timestamp)
    const maxAge = 60 * 60 * 24 * 7 * 1000 // 7 days in milliseconds
    
    if (sessionAge > maxAge) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ 
      authenticated: true, 
      address 
    })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
