"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/chat-interface";
import { ChatHistory } from "@/components/chat-history";
import { ActivePermissionsSidebar } from "@/components/active-swaps-sidebar";
import ConnectWalletButton from "@/components/connect-wallet-button";
import { X, MessageSquare, Activity } from "lucide-react";
import { useAccount } from "wagmi";

export default function Page() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [leftSidebarContent, setLeftSidebarContent] = useState<"chat" | "permissions">("chat");
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const { isConnected, address } = useAccount();

  // Establish a simple session cookie once a wallet is connected
  useEffect(() => {
    const ensureSession = async () => {
      if (!isConnected || !address) return;
      try {
        await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ address }),
        });
      } catch (err) {
        console.error("Failed to create session", err);
      }
    };

    void ensureSession();
  }, [isConnected, address]);

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Close mobile sidebar after selection
    if (window.innerWidth < 768) {
      setLeftSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="brutalist-border border-b-4 p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu buttons */}
          <div className="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => {
                setLeftSidebarContent("chat");
                setLeftSidebarOpen(!leftSidebarOpen);
                setRightSidebarOpen(false);
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => {
                setLeftSidebarContent("permissions");
                setLeftSidebarOpen(!leftSidebarOpen);
                setRightSidebarOpen(false);
              }}
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>

          <h1 className="text-lg md:text-xl font-black tracking-tight">INTENTSWAP</h1>
          <div className="hidden sm:block text-xs font-mono text-muted-foreground">
            AI TRADING TERMINAL
          </div>
        </div>

        <ConnectWalletButton title={isConnected ? undefined : "CONNECT WALLET"} />
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Chat History (Desktop) */}
        <div className="hidden md:flex w-80 brutalist-border border-r-4 bg-card flex-col h-full">
          <ChatHistory onSelectSession={handleSessionSelect} currentSessionId={currentSessionId} />
        </div>

        {/* Mobile Left Sidebar */}
        <div
          className={`${
            leftSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:hidden transition-transform duration-300 absolute z-10 h-full w-80 brutalist-border border-r-4 bg-card flex flex-col`}
        >
          <div className="flex-shrink-0 flex items-center justify-between p-3 brutalist-border border-b-4">
            <div className="text-sm font-black">
              {leftSidebarContent === "chat" ? "CHAT_HISTORY" : "ACTIVE_PERMISSIONS"}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => setLeftSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            {leftSidebarContent === "chat" ? (
              <ChatHistory
                onSelectSession={handleSessionSelect}
                currentSessionId={currentSessionId}
              />
            ) : (
              <ActivePermissionsSidebar
                userAddress={address || ""}
                onClose={() => setLeftSidebarOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Mobile overlay */}
        {leftSidebarOpen && (
          <div
            className="md:hidden absolute inset-0 bg-black/50 z-5"
            onClick={() => setLeftSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {isConnected ? (
            <ChatInterface sessionId={currentSessionId} onSessionChange={setCurrentSessionId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-black">CONNECT TO START SWAPPING</h2>
                <p className="font-mono text-muted-foreground max-w-md">
                  Connect a wallet on Base to start chatting with the AI swap agent.
                </p>
              </div>
              <ConnectWalletButton title="CONNECT WALLET" />
            </div>
          )}
        </div>

        {/* Right Sidebar - Active Swaps (Desktop) */}
        <div className="hidden md:block w-80 brutalist-border border-l-4 bg-card">
          <ActivePermissionsSidebar
            userAddress={address || ""}
          />
        </div>
      </div>
    </div>
  );
}
