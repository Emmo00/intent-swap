"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

export default function StartSwappingButton() {
  const { isConnected, isConnecting } = useAccount();
  const { open, close } = useAppKit();

  const handleStartSwapping = async () => {
    if (!isConnected) {
      try {
        await open({ namespace: "eip155" });
        // After successful sign-in, redirect to app
        window.location.href = "/app";
      } catch (error) {
        console.error("Sign in failed:", error);
      }
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
