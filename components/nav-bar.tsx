"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import ConnectButton from "./connect-wallet-button";

export default function NavBar() {
  const { isConnected } = useAccount();

  return (
    <header className="brutalist-border border-b-4 p-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">INTENTSWAP</h1>
        <nav className="flex items-center gap-4">
          <Link
            href="https://github.com/Emmo00/intent-swap"
            className="text-foreground hover:text-primary transition-colors font-mono font-bold"
          >
            GITHUB
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
