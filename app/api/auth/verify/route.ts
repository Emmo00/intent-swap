import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address' }, 
        { status: 400 }
      )
    }

    // Create session (simple approach - use JWT in production)
    const sessionData = `${address}:${Date.now()}`
    const sessionToken = Buffer.from(sessionData).toString('base64')

    const response = NextResponse.json({ 
      success: true, 
      address 
    })

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    console.log('✅ Session created for address:', address)

    return response
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    )
  }
}
