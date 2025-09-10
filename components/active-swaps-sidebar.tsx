"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ActiveSwap {
  id: string
  tokenPair: string
  amount: string
  status: "pending" | "completed" | "failed"
  timestamp: Date
}

const mockSwaps: ActiveSwap[] = [
  {
    id: "1",
    tokenPair: "ETH → USDC",
    amount: "0.5 ETH",
    status: "completed",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    tokenPair: "USDC → WETH",
    amount: "1000 USDC",
    status: "pending",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "3",
    tokenPair: "DAI → ETH",
    amount: "500 DAI",
    status: "completed",
    timestamp: new Date(Date.now() - 600000),
  },
]

interface ActiveSwapsSidebarProps {
  onClose?: () => void
}

export function ActiveSwapsSidebar({ onClose }: ActiveSwapsSidebarProps) {
  const getStatusColor = (status: ActiveSwap["status"]) => {
    switch (status) {
      case "completed":
        return "bg-primary text-primary-foreground"
      case "pending":
        return "bg-secondary text-secondary-foreground"
      case "failed":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="w-80 md:w-80 sm:w-72 brutalist-border border-r-4 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      {/* Header */}
      <div className="p-3 md:p-4 brutalist-border border-b-4 flex items-center justify-between">
        <div>
          <h2 className="font-black text-base md:text-lg tracking-tight">ACTIVE SWAPS</h2>
          <p className="text-xs text-sidebar-foreground/70 font-mono mt-1">SpendPermission transactions</p>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <Button variant="ghost" size="sm" className="md:hidden p-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Swaps List */}
      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-3">
          {mockSwaps.map((swap) => (
            <div
              key={swap.id}
              className="brutalist-border bg-sidebar-accent p-2 md:p-3 space-y-2 shadow-[4px_4px_0px_var(--border)] md:shadow-[8px_8px_0px_var(--border)]"
            >
              {/* Token Pair */}
              <div className="flex items-center justify-between">
                <div className="font-black text-xs md:text-sm">{swap.tokenPair}</div>
                <Badge className={`${getStatusColor(swap.status)} font-black text-xs brutalist-border`}>
                  {swap.status.toUpperCase()}
                </Badge>
              </div>

              {/* Amount */}
              <div className="text-xs font-mono text-sidebar-foreground/80">{swap.amount}</div>

              {/* Timestamp */}
              <div className="text-xs text-sidebar-foreground/60 font-mono">
                {swap.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>

              {/* Terminal indicator */}
              <div className="flex items-center gap-1 pt-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    swap.status === "pending"
                      ? "bg-secondary animate-pulse"
                      : swap.status === "completed"
                        ? "bg-primary"
                        : "bg-destructive"
                  }`}
                ></div>
                <div className="text-xs font-mono text-sidebar-foreground/50">TX_{swap.id.padStart(3, "0")}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 md:p-4 brutalist-border border-t-4">
        <div className="text-xs font-mono text-sidebar-foreground/60 text-center">Powered by Base SpendPermissions</div>
      </div>
    </div>
  )
}
