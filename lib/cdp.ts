import { CdpClient } from "@coinbase/cdp-sdk";
import { createWalletClient, http } from "viem";
import { toAccount } from "viem/accounts";
import { base } from "viem/chains";

let cdpClient: CdpClient | null = null;

export function getCdpClient(): CdpClient {
  if (!cdpClient) {
    const config = {
      apiKeyId: process.env.CDP_API_KEY_ID!,
      apiKeySecret: process.env.CDP_API_KEY_SECRET!,
      walletSecret: process.env.CDP_WALLET_SECRET!,
    }; 
    console.log("cdp config", config);
    cdpClient = new CdpClient(config);
  }
  return cdpClient;
}

export async function getServerWallet() {
  const account = await getCdpClient().evm.getOrCreateAccount({ name: "IntentSwap Server" });

  console.log("Server wallet address:", account.address);

  // Create viem wallet client
  const walletClient = createWalletClient({
    account: toAccount(account),
    chain: base,
    transport: http(),
  });

  // Create smart account for gas sponsorship
  const smartAccount = await getCdpClient().evm.createSmartAccount({
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
