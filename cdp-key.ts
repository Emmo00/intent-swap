import "dotenv/config";
import { CdpClient } from "@coinbase/cdp-sdk";

const cdp = new CdpClient();

async function main() {
  let account;
  try {
    account = await cdp.evm.createAccount({ name: "intent-swap-test" });
    console.log("evm account created", account.address);
  } catch (error) {
    console.error("error creating evm account", error);
  }
  try {
    account = await cdp.evm.getAccount({ name: "intent-swap-test" });
    console.log(`Retrieved EVM account: ${account.address}`);
  } catch (error) {
    console.log("error trying to retrieve evm account", error);
  }

  if (!account) {
    console.error("Failed to create or retrieve account");
    return;
  }

  try {
    const sa = await cdp.evm.createSmartAccount({
      owner: account,
      name: "intent-swap-test",
    });

    console.log(`Created smart account: ${sa.address}`);
  } catch (error) {
    console.error("error while creating smart account", error);
  }

  try {
    const s = await cdp.evm.getSmartAccount({ name: "intent-swap-test", owner: account });

    console.log("retrieved smart account", s.address);
  } catch (error) {
    console.error("error getting smart account", error);
  }
}

main();
