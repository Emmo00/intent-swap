"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

export default function StartSwappingButton() {
  const { isConnected, isConnecting } = useAccount();
  const { openConnectModal } = useConnectModal();

  const handleStartSwapping = async () => {
    if (!isConnected) {
      openConnectModal?.();
    } else {
      // Already connected, go to app
      window.location.href = "/app";
    }
  };

  return (
    <Button
      onClick={handleStartSwapping}
      disabled={isConnecting}
      size="lg"
      className="brutalist-border brutalist-shadow bg-primary text-primary-foreground hover:bg-primary/90 text-xl font-black px-12 py-6 h-auto"
    >
      {isConnecting ? "CONNECTING..." : "START SWAPPING"}
    </Button>
  );
}
