import { base } from "viem/chains"

const { ZERO_EX_API_KEY } = process.env

if (!ZERO_EX_API_KEY) {
  throw new Error("Missing ZERO_EX_API_KEY in environment variables")
}

const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZERO_EX_API_KEY,
  "0x-version": "v2",
})

const baseChainId = base.id.toString()

type SwapRequest = {
  sellToken: string
  buyToken: string
  sellAmount: string
  taker?: `0x${string}` | string
}

export async function getPermit2Price({ sellToken, buyToken, sellAmount, taker }: SwapRequest) {
  const params = new URLSearchParams({
    chainId: baseChainId,
    sellToken,
    buyToken,
    sellAmount,
  })

  if (taker) params.set('taker', taker)

  const res = await fetch(`https://api.0x.org/swap/permit2/price?${params.toString()}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch price: ${await res.text()}`)
  }

  return res.json()
}

export async function getPermit2Quote({ sellToken, buyToken, sellAmount, taker }: SwapRequest) {
  const params = new URLSearchParams({
    chainId: baseChainId,
    sellToken,
    buyToken,
    sellAmount,
  })

  if (taker) params.set('taker', taker)

  const res = await fetch(`https://api.0x.org/swap/permit2/quote?${params.toString()}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch quote: ${await res.text()}`)
  }

  return res.json()
}
