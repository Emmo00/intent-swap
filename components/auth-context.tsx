import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createBaseAccountSDK } from '@base-org/account'

interface AuthContextType {
  isConnected: boolean
  address: string | null
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already signed in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status')
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated) {
            setIsConnected(true)
            setAddress(data.address)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }
    checkAuth()
  }, [])

  const signIn = async () => {
    try {
      setIsLoading(true)
      
      // Initialize the SDK
      const provider = createBaseAccountSDK({ appName: 'IntentSwap' }).getProvider()

      // First, request accounts
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      const userAddress = accounts[0]

      // Get a fresh nonce
      const nonceResponse = await fetch('/api/auth/nonce')
      const nonce = await nonceResponse.text()

      // Switch to Base Chain
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: '0x2105' }], // Base Mainnet
      })

      // Try the new wallet_connect method first
      try {
        const connectResult = await provider.request({
          method: 'wallet_connect',
          params: [{
            version: '1',
            capabilities: {
              signInWithEthereum: { 
                nonce, 
                chainId: '0x2105'
              }
            }
          }]
        }) as any

        const { accounts: connectedAccounts } = connectResult
        const { address: connectedAddress } = connectedAccounts[0]
        const { message, signature } = connectedAccounts[0].capabilities.signInWithEthereum

        // Verify with backend
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: connectedAddress, message, signature })
        })

        if (verifyResponse.ok) {
          setIsConnected(true)
          setAddress(connectedAddress)
        } else {
          throw new Error('Authentication failed')
        }
      } catch (walletError: any) {
        // Fallback for wallets that don't support wallet_connect
        console.log('Falling back to personal_sign method:', walletError.message)
        
        // Create SIWE message manually
        const message = `IntentSwap wants you to sign in with your Ethereum account:\n${userAddress}\n\nSign in to IntentSwap\n\nURI: ${window.location.origin}\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}`
        
        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, userAddress]
        }) as string

        // Verify with backend
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: userAddress, message, signature })
        })

        if (verifyResponse.ok) {
          setIsConnected(true)
          setAddress(userAddress)
        } else {
          throw new Error('Authentication failed')
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsConnected(false)
      setAddress(null)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const value = {
    isConnected,
    address,
    isLoading,
    signIn,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
