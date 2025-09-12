import { NextRequest, NextResponse } from 'next/server';
import { getSwapPrice } from '../../../../lib/swap';
import { createPublicClient, http, getContract, erc20Abi, parseUnits } from 'viem';
import { base } from 'viem/chains';

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: publicClient
    });
    
    const decimals = await tokenContract.read.decimals();
    return Number(decimals);
  } catch (error) {
    console.warn(`Failed to fetch decimals for ${tokenAddress}, using 18:`, error);
    return 18; // Default fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sellToken, buyToken, sellAmount, userAddress } = await req.json();
    if (!sellToken || !buyToken || !sellAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log("Received swap price request:", { sellToken, buyToken, sellAmount, userAddress });

    // Get the sell token decimals to convert sellAmount to base units
    const sellTokenDecimals = await getTokenDecimals(sellToken);
    
    // Convert sellAmount from human-readable to base units (wei)
    const sellAmountInBaseUnits = parseUnits(sellAmount.toString(), sellTokenDecimals);
    
    console.log(`📊 Converting sell amount: ${sellAmount} -> ${sellAmountInBaseUnits.toString()} (${sellTokenDecimals} decimals)`);
    
    const price = await getSwapPrice(sellToken, buyToken, sellAmountInBaseUnits.toString(), userAddress);
    return NextResponse.json({
      buyAmount: price.buyAmount,
      minBuyAmount: price.minBuyAmount,
      buyToken: price.buyToken,
      sellAmount: price.sellAmount,
      sellToken: price.sellToken,
      route: price.route,
      gas: price.gas,
      gasPrice: price.gasPrice,
      totalNetworkFee: price.totalNetworkFee,
      issues: price.issues,
      tokenMetadata: price.tokenMetadata,
      liquidityAvailable: price.liquidityAvailable,
      allowanceTarget: price.allowanceTarget,
      blockNumber: price.blockNumber,
      fees: price.fees,
      zid: price.zid,
    });
  } catch (error: any) {
    console.error('❌ /api/swap/price error:', error);
    return NextResponse.json({ error: 'Failed to fetch swap price' }, { status: 500 });
  }
}
