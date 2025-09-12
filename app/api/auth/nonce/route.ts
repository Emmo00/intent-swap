import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate time-based nonce that can be validated without server-side storage
export async function GET() {
  try {
    // Create a nonce with timestamp prefix for serverless environments
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(10, '0')
    const randomBytes = crypto.randomBytes(11).toString('hex')
    const nonce = timestamp + randomBytes
    
    return new NextResponse(nonce, {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 })
  }
}
