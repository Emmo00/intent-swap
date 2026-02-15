"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { RefreshCw } from "lucide-react";

interface SwapTx {
  txHash: string;
  sellSymbol: string;
  sellAmount: string;
  buySymbol: string;
  buyAmount: string;
  status: "confirmed" | "reverted" | "pending";
  createdAt: string;
}

export function TransactionHistory() {
  const { isConnected } = useAccount();
  const [transactions, setTransactions] = useState<SwapTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!isConnected) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/swap/history?limit=30", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Expose a global event so the chat interface can trigger a refresh
  useEffect(() => {
    const handler = () => loadTransactions();
    window.addEventListener("swap-completed", handler);
    return () => window.removeEventListener("swap-completed", handler);
  }, [loadTransactions]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const statusColor = (s: string) => {
    if (s === "confirmed") return "bg-green-500/20 text-green-700 dark:text-green-400";
    if (s === "reverted") return "bg-red-500/20 text-red-700 dark:text-red-400";
    return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
  };

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="text-xs font-mono">Connect wallet to view history</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-3 brutalist-border border-b-4 flex items-center justify-between">
        <div className="text-sm font-black">SWAP_HISTORY</div>
        <Button
          variant="ghost"
          size="sm"
          className="p-1"
          onClick={loadTransactions}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading && transactions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-xs font-mono">
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-xs font-mono mb-1">NO TRANSACTIONS YET</div>
            <div className="text-xs opacity-70">Complete a swap to see it here</div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {transactions.map((tx) => (
              <a
                key={tx.txHash}
                href={`https://basescan.org/tx/${tx.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 brutalist-border bg-card hover:bg-muted/50 transition-colors cursor-pointer shadow-[2px_2px_0px_var(--border)]"
              >
                {/* Top row: tokens + status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="text-xs font-black truncate">
                    {tx.sellSymbol} → {tx.buySymbol}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-mono px-1.5 py-0 ${statusColor(tx.status)}`}
                  >
                    {tx.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Amounts */}
                <div className="text-xs font-mono text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>Sold</span>
                    <span className="text-foreground">
                      {Number(tx.sellAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                      {tx.sellSymbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Got</span>
                    <span className="text-foreground">
                      {Number(tx.buyAmount).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
                      {tx.buySymbol}
                    </span>
                  </div>
                </div>

                {/* Bottom: tx hash + time  */}
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[120px]">
                    {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                  </span>
                  <span>{formatDate(tx.createdAt)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
