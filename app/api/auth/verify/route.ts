import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { nonces } from '../nonce/route'

const client = createPublicClient({ 
  chain: base, 
  transport: http() 
})

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json()

    if (!address || !message || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: ([a-f0-9]{32})/)
    const nonce = nonceMatch?.[1]

    if (!nonce || !nonces.has(nonce)) {
      return NextResponse.json(
        { error: 'Invalid or expired nonce' }, 
        { status: 400 }
      )
    }

    // Remove used nonce
    nonces.delete(nonce)

    // Verify signature
    const isValid = await client.verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`
    })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' }, 
        { status: 401 }
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

    return response
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    )
  }
}
