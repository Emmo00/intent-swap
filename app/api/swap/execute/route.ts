import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

export async function POST(req: NextRequest) {
  try {
    const { signedTransaction } = await req.json()

    if (!signedTransaction) {
      return NextResponse.json({ error: 'Missing signedTransaction' }, { status: 400 })
    }

    const hash = await publicClient.sendRawTransaction({
      serializedTransaction: signedTransaction as `0x${string}`,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({ hash, receipt })
  } catch (error) {
    console.error('❌ /api/swap/execute error:', error)
    return NextResponse.json({ error: 'Failed to submit swap transaction' }, { status: 500 })
  }
}
