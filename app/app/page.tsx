"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { ActiveSwapsSidebar } from "@/components/active-swaps-sidebar"
import { Menu, X } from "lucide-react"

export default function AppPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleConnectWallet = () => {
    // Wallet connection logic would go here
    console.log("Connect wallet clicked")
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="brutalist-border border-b-4 p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>

          <h1 className="text-lg md:text-xl font-black tracking-tight">INTENTSWAP</h1>
          <div className="hidden sm:block text-xs font-mono text-muted-foreground">AI TRADING TERMINAL</div>
        </div>

        <Button
          onClick={handleConnectWallet}
          variant="outline"
          className="brutalist-border brutalist-shadow font-black text-xs md:text-sm bg-transparent px-3 md:px-4"
        >
          <span className="hidden sm:inline">CONNECT WALLET</span>
          <span className="sm:hidden">WALLET</span>
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 absolute md:relative z-10 h-full`}
        >
          <ActiveSwapsSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="md:hidden absolute inset-0 bg-black/50 z-5" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
