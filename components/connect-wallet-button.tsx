"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function ConnectWalletButton({ title }: { title?: string }) {
  return <ConnectButton label={title || 'CONNECT WALLET'} />
}
