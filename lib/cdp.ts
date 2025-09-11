import { CdpClient } from "@coinbase/cdp-sdk";
import { createWalletClient, http } from "viem";
import { toAccount } from "viem/accounts";
import { base } from "viem/chains";
import type { ServerWallet } from "@/types";
import "dotenv/config";

export const cdpClient = new CdpClient();

export async function getServerWallet() {
  const account = await cdpClient.evm.getOrCreateAccount({ name: "IntentSwap Server" });

  console.log("Server wallet address:", account.address);

  // Create viem wallet client
  const walletClient = createWalletClient({
    account: toAccount(account),
    chain: base,
    transport: http(),
  });

  // Create smart account for gas sponsorship
  const smartAccount = await cdpClient.evm.createSmartAccount({
    owner: account,
  });

  console.log("Smart account:", smartAccount);

  const serverWallet = {
    address: account.address,
    walletClient,
    account,
    smartAccount,
  };

  return serverWallet;
}

