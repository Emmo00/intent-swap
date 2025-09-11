import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";

dotenv.config();

const cdp = new CdpClient();

export async function getServerWallet() {
  const account = await cdp.evm.getOrCreateAccount({ name: "IntentSwap Server" });
  
  console.log("Server wallet address:", account.address);
  return account;
}
