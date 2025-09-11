import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, getContract, erc20Abi } from 'viem'
import { base } from 'viem/chains'

const publicClient = createPublicClient({
  chain: base,
  transport: http()
})

export async function POST(request: NextRequest) {
  try {
    const { tokenAddress } = await request.json()
    
    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Missing tokenAddress' },
        { status: 400 }
      )
    }

    // Create contract instance
    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: publicClient
    })

    // Call decimals() function
    const decimals = await tokenContract.read.decimals()
    
    return NextResponse.json({ decimals: Number(decimals) })
    
  } catch (error) {
    console.error('❌ Token decimals error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch token decimals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
