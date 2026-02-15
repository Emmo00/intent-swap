import { NextRequest, NextResponse } from 'next/server'
import { swapTransactionDatabase } from '@/lib/database'

function getUserAddress(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('session')
  if (!sessionCookie?.value) return null
  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString()
    const [address, timestamp] = decoded.split(':')
    const age = Date.now() - parseInt(timestamp)
    if (age > 7 * 24 * 60 * 60 * 1000) return null // expired
    return address || null
  } catch {
    return null
  }
}

// POST — save a new swap transaction
export async function POST(request: NextRequest) {
  try {
    const userAddress = getUserAddress(request)
    if (!userAddress) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { txHash, sellToken, sellSymbol, sellAmount, buyToken, buySymbol, buyAmount, status } = body

    if (!txHash || !sellToken || !sellSymbol || !sellAmount || !buyToken || !buySymbol || !buyAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent duplicates silently
    const existing = await swapTransactionDatabase.getByHash(txHash)
    if (existing) {
      return NextResponse.json({ success: true, transaction: existing })
    }

    const transaction = await swapTransactionDatabase.create({
      userId: userAddress.toLowerCase(),
      txHash,
      sellToken,
      sellSymbol,
      sellAmount,
      buyToken,
      buySymbol,
      buyAmount,
      status: status || 'confirmed',
    })

    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    console.error('❌ /api/swap/history POST error:', error)
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 })
  }
}

// GET — fetch user's swap history
export async function GET(request: NextRequest) {
  try {
    const userAddress = getUserAddress(request)
    if (!userAddress) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const transactions = await swapTransactionDatabase.getByUser(userAddress.toLowerCase(), limit)

    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    console.error('❌ /api/swap/history GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
