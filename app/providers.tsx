'use client';

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const url = process.env.NEXT_PUBLIC_URL;

if (!url) {
  throw new Error('NEXT_PUBLIC_URL is not defined');
}


// Set up metadata
const metadata = {
  name: 'intent-swap',
  description: 'An app to swap tokens using intent',
  url,
  icons: [`${url}/apple-touch-icon.png`],
}

const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  }
})


export function Providers(props: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={new QueryClient()}>
        {props.children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
