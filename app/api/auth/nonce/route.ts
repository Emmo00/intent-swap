import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Simple in-memory nonce store (replace with Redis in production)
const nonces = new Set<string>()

export async function GET() {
  try {
    const nonce = crypto.randomBytes(16).toString('hex')
    nonces.add(nonce)
    
    // Clean up old nonces (basic cleanup)
    if (nonces.size > 1000) {
      const nonceArray = Array.from(nonces)
      const toKeep = nonceArray.slice(-500)
      nonces.clear()
      toKeep.forEach(n => nonces.add(n))
    }
    
    return new NextResponse(nonce, {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return NextResponse.json({ error: 'Failed to generate nonce' }, { status: 500 })
  }
}

export { nonces }
