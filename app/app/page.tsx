"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { ActiveSwapsSidebar } from "@/components/active-swaps-sidebar"
import { AuthProvider, useAuth } from "@/components/auth-context"
import { SignInWithBaseButton, ConnectedButton } from "@/components/sign-in-with-base"
import { Menu, X } from "lucide-react"

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isConnected } = useAuth()

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

        {isConnected ? (
          <ConnectedButton />
        ) : (
          <SignInWithBaseButton size="sm" variant="outline">
            CONNECT WALLET
          </SignInWithBaseButton>
        )}
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
          {isConnected ? (
            <ChatInterface />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-black">CONNECT TO START SWAPPING</h2>
                <p className="font-mono text-muted-foreground max-w-md">
                  Sign in with your Base account to start chatting with the AI swap agent.
                </p>
              </div>
              <SignInWithBaseButton size="lg">
                SIGN IN WITH BASE
              </SignInWithBaseButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppPage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
