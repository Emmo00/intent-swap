"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { getUserSpendPermissions, revokeSpendPermission } from "@/lib/spend-permissions"

interface ActivePermissionsSidebarProps {
  userAddress: string
  spenderAddress: string
  tokenAddress: string
  onClose?: () => void
}

export function ActivePermissionsSidebar({ userAddress, spenderAddress, tokenAddress, onClose }: ActivePermissionsSidebarProps) {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const perms = await getUserSpendPermissions(userAddress, spenderAddress, tokenAddress)
      setPermissions(perms)
    } catch (e) {
      setPermissions([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (userAddress && spenderAddress && tokenAddress) {
      loadPermissions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress, spenderAddress, tokenAddress])

  const handleRevoke = async (permission: any) => {
    setRevoking(permission.permissionHash || permission.id || "")
    try {
      await revokeSpendPermission(permission.permission || permission)
      await loadPermissions()
    } catch (e) {
      // Optionally show error
    }
    setRevoking(null)
  }

  return (
    <div className="w-80 md:w-80 sm:w-72 brutalist-border border-r-4 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      {/* Header */}
      <div className="p-3 md:p-4 brutalist-border border-b-4 flex items-center justify-between">
        <div>
          <h2 className="font-black text-base md:text-lg tracking-tight">ACTIVE PERMISSIONS</h2>
          <p className="text-xs text-sidebar-foreground/70 font-mono mt-1">SpendPermission grants</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" className="md:hidden p-1" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Permissions List */}
      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-3">
          {loading ? (
            <div className="text-xs text-sidebar-foreground/60">Loading...</div>
          ) : permissions.length === 0 ? (
            <div className="text-xs text-sidebar-foreground/60">No active spend permissions found.</div>
          ) : (
            permissions.map((perm, idx) => {
              const allowance = perm.permission?.allowance || perm.allowance
              const period = perm.permission?.periodInDays || perm.periodInDays
              const hash = perm.permission?.permissionHash || perm.permissionHash || perm.id || ""
              return (
                <div
                  key={hash + idx}
                  className="brutalist-border bg-sidebar-accent p-2 md:p-3 space-y-2 shadow-[4px_4px_0px_var(--border)] md:shadow-[8px_8px_0px_var(--border)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-black text-xs md:text-sm">{((Number(allowance) / 1_000_000).toFixed(2))} USDC</div>
                    <Badge className="bg-primary text-primary-foreground font-black text-xs brutalist-border">{period}d</Badge>
                  </div>
                  <div className="text-xs font-mono text-sidebar-foreground/80">Hash: {hash.slice(0, 10)}...</div>
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
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 md:p-4 brutalist-border border-t-4">
        <div className="text-xs font-mono text-sidebar-foreground/60 text-center">Powered by Base & 0x</div>
      </div>
    </div>
  )
}
