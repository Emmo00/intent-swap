import { CdpClient } from "@coinbase/cdp-sdk";
import { createWalletClient, http } from "viem";
import { toAccount } from "viem/accounts";
import { base } from "viem/chains";

let cdpClient: CdpClient | null = null;

export function getCdpClient(): CdpClient {
  if (!cdpClient) {
    cdpClient = new CdpClient();
  }
  return cdpClient;
}

export async function getServerWallet() {
  const cdp = getCdpClient();

  let account;
  let smartAccount;

  try {
    account = await cdp.evm.createAccount({ name: "intent-swap-wallet" });
    console.log("evm account created", account.address);
  } catch (error) {
    console.error("error creating evm account", error);
  }

  try {
    account = await cdp.evm.getAccount({ name: "intent-swap-wallet" });
    console.log(`Retrieved EVM account: ${account.address}`);
  } catch (error) {
    console.log("error trying to retrieve evm account", error);
  }

  if (!account) {
    throw new Error("Failed to create or retrieve account");
  }

  try {
    smartAccount = await cdp.evm.createSmartAccount({
      owner: account,
      name: "intent-swap-wallet",
    });

    console.log(`Created smart account: ${smartAccount.address}`);
  } catch (error) {
    console.error("error while creating smart account", error);
  }

  try {
    smartAccount = await cdp.evm.getSmartAccount({ name: "intent-swap-wallet", owner: account });

    console.log("retrieved smart account", smartAccount.address);
  } catch (error) {
    console.error("error getting smart account", error);
  }

  // Create viem wallet client
  const walletClient = createWalletClient({
    account: toAccount(account),
    chain: base,
    transport: http(),
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
