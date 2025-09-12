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

      // Switch to Base Chain
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: '0x2105' }], // Base Mainnet
      })

      // Try to connect wallet and get address
      try {
        const connectResult = await provider.request({
          method: 'wallet_connect',
          params: [{
            version: '1'
          }]
        }) as any

        const { accounts: connectedAccounts } = connectResult
        const { address: connectedAddress } = connectedAccounts[0]

        // Create session with just the address
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: connectedAddress })
        })

        if (verifyResponse.ok) {
          setIsConnected(true)
          setAddress(connectedAddress)
        } else {
          throw new Error('Authentication failed')
        }
      } catch (walletError: any) {
        // Fallback: just request accounts and use the address
        console.log('Falling back to eth_requestAccounts method:', walletError.message)
        
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        }) as string[]

        const address = accounts[0]

        // Create session with just the address  
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        })

        if (verifyResponse.ok) {
          setIsConnected(true)
          setAddress(address)
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
