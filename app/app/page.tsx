"use client"

import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { ActiveSwapsSidebar } from "@/components/active-swaps-sidebar"

export default function AppPage() {
  const handleConnectWallet = () => {
    // Wallet connection logic would go here
    console.log("Connect wallet clicked")
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="brutalist-border border-b-4 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tight">INTENTSWAP</h1>
          <div className="text-xs font-mono text-muted-foreground">AI TRADING TERMINAL</div>
        </div>

        <Button
          onClick={handleConnectWallet}
          variant="outline"
          className="brutalist-border brutalist-shadow font-black text-sm bg-transparent"
        >
          CONNECT WALLET
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ActiveSwapsSidebar />

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
