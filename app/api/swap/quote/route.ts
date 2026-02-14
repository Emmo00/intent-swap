import { NextRequest, NextResponse } from 'next/server'
import { getPermit2Quote } from '@/lib/swap'
import { createPublicClient, erc20Abi, getContract, http, parseUnits } from 'viem'
import { base } from 'viem/chains'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: publicClient,
    })

    const decimals = await tokenContract.read.decimals()
    return Number(decimals)
  } catch (error) {
    console.warn(`Failed to fetch decimals for ${tokenAddress}, using 18:`, error)
    return 18
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sellToken, buyToken, sellAmount, userAddress } = await req.json()

    if (!sellToken || !buyToken || !sellAmount || !userAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sellTokenDecimals = await getTokenDecimals(sellToken)
    const sellAmountInBaseUnits = parseUnits(sellAmount.toString(), sellTokenDecimals)

    const quote = await getPermit2Quote({
      sellToken,
      buyToken,
      sellAmount: sellAmountInBaseUnits.toString(),
      taker: userAddress,
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('❌ /api/swap/quote error:', error)
    return NextResponse.json({ error: 'Failed to fetch swap quote' }, { status: 500 })
  }
}