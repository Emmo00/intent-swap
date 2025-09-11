import { NextRequest, NextResponse } from 'next/server'
import { getServerWallet } from '@/lib/cdp'

// This endpoint creates/retrieves the server wallet that will be used as the spender
// for spend permissions across all users
export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Creating server wallet for spend permissions...')
    
    // Get or create the server wallet that will act as the spender
    const serverWallet = await getServerWallet()
    
    console.log('✅ Server wallet ready for spend permissions')
    console.log('📍 Server Wallet Address:', serverWallet.address)
    console.log('🔒 Smart Account Address:', serverWallet.smartAccount?.address || 'Not available')
    
    return NextResponse.json({
      success: true,
      message: 'Server wallet ready for spend permissions',
      serverWalletAddress: serverWallet.address,
      smartAccountAddress: serverWallet.smartAccount?.address || null,
    })
    
  } catch (error) {
    console.error('❌ Failed to create server wallet:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create server wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Retrieving server wallet info...')
    
    // Get the server wallet info
    const serverWallet = await getServerWallet()
    
    return NextResponse.json({
      success: true,
      serverWalletAddress: serverWallet.address,
      smartAccountAddress: serverWallet.smartAccount?.address || null,
    })
    
  } catch (error) {
    console.error('❌ Failed to retrieve server wallet:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve server wallet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
