"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  fetchPermissions,
  fetchPermission,
  getPermissionStatus,
  prepareSpendCallData,
  requestSpendPermission,
  requestRevoke,
  prepareRevokeCallData,
} from "@base-org/account/spend-permission";

import { createBaseAccountSDK } from "@base-org/account";
import { chainConfig } from "viem/zksync";

interface ActivePermissionsSidebarProps {
  userAddress: string;
  onClose?: () => void;
}

export function ActivePermissionsSidebar({ userAddress, onClose }: ActivePermissionsSidebarProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverWallet, setServerWallet] = useState<any>();

  const fetchServerWallet = async () => {
    // get server wallets
    const serverWalletResponse = await fetch("/api/wallet/server", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!serverWalletResponse.ok) {
      throw new Error(`Error fetching server wallet: ${await serverWalletResponse.text()}`);
    }

    const serverWallet = await serverWalletResponse.json();
    console.log("server wallet from active swaps", serverWallet);
    return await serverWallet.wallet;
  };

  useEffect(() => {
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const wallet = await fetchServerWallet();
        console.log("fetched server wallet active swaps", wallet);
        setServerWallet(wallet);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      console.log("getting permissions for", {
        userAddress,
        spenderAddress: serverWallet?.smartAccountAddress,
      });
      const perms = await fetchPermissions({
        account: userAddress as `0x${string}`,
        spender: serverWallet?.smartAccountAddress as `0x${string}`,
        chainId: 8453,
        provider: createBaseAccountSDK({
          appName: "Intentswap",
          paymasterUrls: [process.env.NEXT_PUBLIC_PAYMASTER_URL!],
        }).getProvider(),
      });
      setPermissions(perms);
    } catch (e) {
      setPermissions([]);
      setError("Failed to load permissions");
      setTimeout(() => setError(null), 0);
    }
    setLoading(false);
  };

  // Silent refetch every 5 minutes
  useEffect(() => {
    if (!userAddress || !serverWallet?.smartAccountAddress) return;

    const intervalId = setInterval(async () => {
      try {
        console.log("🔄 Silent refetch of permissions...");
        const perms = await fetchPermissions({
          account: userAddress as `0x${string}`,
          spender: serverWallet?.smartAccountAddress as `0x${string}`,
          chainId: 8453,
          provider: createBaseAccountSDK({
            appName: "Intentswap",
            paymasterUrls: [process.env.NEXT_PUBLIC_PAYMASTER_URL!],
          }).getProvider(),
        });
        setPermissions(perms);
      } catch (e) {
        console.error("❌ Silent refetch failed:", e);
        // Don't update error state during silent refetch
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [userAddress, serverWallet?.smartAccountAddress]);

  useEffect(() => {
    if (userAddress && serverWallet?.smartAccountAddress) {
      loadPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, serverWallet]);

  const handleRevoke = async (permission: any) => {
    setRevoking(permission.permissionHash || permission.id || "");
    try {
      console.log("revoking permission");
      const provider = createBaseAccountSDK({
        appName: "Intentswap",
        appChainIds: [8453],
        paymasterUrls: [process.env.NEXT_PUBLIC_PAYMASTER_URL!],
      }).getProvider();

      await requestRevoke({
        provider,
        permission,
      });

      console.log("revoke sucessful");

      await loadPermissions();
    } catch (e) {
      setError("Failed to revoke permissions");
      setTimeout(() => setError(null), 5000);
    }
    setRevoking(null);
  };

  return (
    <div className="w-80 md:w-80 sm:w-72 brutalist-border border-r-4 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      {/* Permissions List */}
      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-3">
          {error && (
            <div className="brutalist-border bg-destructive text-destructive-foreground p-2 md:p-3 text-xs font-black">
              ⚠️ {error}
            </div>
          )}
          {loading ? (
            <div className="text-xs text-sidebar-foreground/60">Loading...</div>
          ) : permissions.length === 0 ? (
            <div className="text-xs text-sidebar-foreground/60">
              No active spend permissions found.
            </div>
          ) : (
            permissions.map((perm, idx) => {
              const allowance = perm.permission?.allowance || perm.allowance;
              const period = perm.permission?.periodInDays || perm.periodInDays;
              const hash = perm.permission?.permissionHash || perm.permissionHash || perm.id || "";
              return (
                <div
                  key={hash + idx}
                  className="brutalist-border bg-sidebar-accent p-2 md:p-3 space-y-2 shadow-[4px_4px_0px_var(--border)] md:shadow-[8px_8px_0px_var(--border)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-black text-xs md:text-sm">
                      {(Number(allowance) / 1_000_000).toFixed(2)} USDC
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-black text-xs brutalist-border">
                      {period}d
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-sidebar-foreground/80">
                    Hash: {hash.slice(0, 10)}...
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full brutalist-border"
                    disabled={revoking === hash}
                    onClick={() => handleRevoke(perm)}
                  >
                    {revoking === hash ? "Revoking..." : "Revoke"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 md:p-4 brutalist-border border-t-4">
        <div className="text-xs font-mono text-sidebar-foreground/60 text-center">
          Powered by Base & 0x
        </div>
      </div>
    </div>
  );
}
