'use client';

import '@rainbow-me/rainbowkit/styles.css'

import { queryClient } from '@/config'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { WagmiProvider, http } from 'wagmi'
import { base } from 'viem/chains'

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!walletConnectProjectId) {
  throw new Error('WalletConnect project id missing: set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')
}

const wagmiConfig = getDefaultConfig({
  appName: 'intent-swap',
  projectId: walletConnectProjectId,
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
})

export function Providers(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
