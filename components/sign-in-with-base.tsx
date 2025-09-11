'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-context'

interface SignInWithBaseButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function SignInWithBaseButton({ 
  variant = 'default', 
  size = 'default', 
  className = '',
  children 
}: SignInWithBaseButtonProps) {
  const { signIn, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    try {
      setError(null)
      await signIn()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={`brutalist-border brutalist-shadow bg-blue-500 hover:bg-blue-600 text-white font-black ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white rounded-sm" />
          <span>
            {isLoading ? 'SIGNING IN...' : children || 'SIGN IN WITH BASE'}
          </span>
        </div>
      </Button>
      {error && (
        <p className="text-xs text-red-500 font-mono">{error}</p>
      )}
    </div>
  )
}

export function ConnectedButton() {
  const { address, signOut, isConnected } = useAuth()

  if (!isConnected || !address) return null

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-mono text-muted-foreground">
        {shortAddress}
      </div>
      <Button
        onClick={signOut}
        variant="outline"
        size="sm"
        className="brutalist-border font-black text-xs"
      >
        DISCONNECT
      </Button>
    </div>
  )
}
