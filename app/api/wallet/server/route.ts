import { NextRequest, NextResponse } from 'next/server'
import { getServerWallet } from '@/lib/cdp'

export async function GET(req: NextRequest) {
  try {
    console.log('🔧 Retrieving server wallet...')
    
    // Get or create the server wallet
    const serverWallet = await getServerWallet()
    
    console.log('✅ Server wallet retrieved successfully')
    console.log('📍 Address:', serverWallet.address)
    console.log('🔒 Smart Account:', serverWallet.smartAccount?.address || 'Not available')
    
    return NextResponse.json({
      success: true,
      wallet: {
        address: serverWallet.address,
        smartAccountAddress: serverWallet.smartAccount?.address || null,
      }
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

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Creating/retrieving server wallet...')
    
    // Get or create the server wallet (same as GET but explicit creation intent)
    const serverWallet = await getServerWallet()
    
    console.log('✅ Server wallet created/retrieved successfully')
    console.log('📍 Address:', serverWallet.address)
    console.log('🔒 Smart Account:', serverWallet.smartAccount?.address || 'Not available')
    
    return NextResponse.json({
      success: true,
      message: 'Server wallet ready',
      wallet: {
        address: serverWallet.address,
        smartAccountAddress: serverWallet.smartAccount?.address || null,
      }
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
