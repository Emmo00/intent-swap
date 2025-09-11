import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote } from '../../../../lib/swap';

export async function POST(req: NextRequest) {
  try {
    const { sellToken, buyToken, sellAmount, userAddress } = await req.json();
    if (!sellToken || !buyToken || !sellAmount || !userAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const quote = await getSwapQuote(sellToken, buyToken, sellAmount, userAddress);
    return NextResponse.json({ quote });
  } catch (error: any) {
    console.error('❌ /api/swap/quote error:', error);
    return NextResponse.json({ error: 'Failed to fetch swap quote' }, { status: 500 });
  }
}
