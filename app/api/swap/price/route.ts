import { NextRequest, NextResponse } from 'next/server';
import { getSwapPrice } from '../../../../lib/swap';

export async function POST(req: NextRequest) {
  try {
    const { sellToken, buyToken, sellAmount } = await req.json();
    if (!sellToken || !buyToken || !sellAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const price = await getSwapPrice(sellToken, buyToken, sellAmount);
    return NextResponse.json({ price });
  } catch (error: any) {
    console.error('❌ /api/swap/price error:', error);
    return NextResponse.json({ error: 'Failed to fetch swap price' }, { status: 500 });
  }
}
