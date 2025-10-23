"use client";

export default function ConnectButton({ title }: { title?: string }) {
  return <appkit-button namespace="eip155">{title || "CONNECT WALLET"}</appkit-button>;
}
