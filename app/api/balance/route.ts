import { NextRequest, NextResponse } from 'next/server'
import { getTokenBalance } from '@/lib/token'

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
    const [_, timestamp] = sessionData.split(':')

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
    const body = await request.json()
    const { token, userAddress } = body

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      )
    }

    console.log(`🔍 Checking balance for token: ${token}, user: ${userAddress}`)

    // Get token balance
    const balance = await getTokenBalance(token, userAddress as `0x${string}`)

    console.log(`✅ Balance retrieved: ${balance} ${token}`)

    return NextResponse.json({
      success: true,
      token,
      balance,
      userAddress,
      formattedBalance: parseFloat(balance).toFixed(6)
    })

  } catch (error) {
    console.error('❌ Balance check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
