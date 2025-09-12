import { NextRequest, NextResponse } from "next/server";
import { approveAllowanceHolderSpend, getSwapQuote } from "../../../../lib/swap";
import {
  createPublicClient,
  http,
  getContract,
  erc20Abi,
  parseUnits,
  numberToHex,
  size,
  Hex,
  concat,
  encodeFunctionData,
} from "viem";
import { base } from "viem/chains";
import { getCdpClient, getServerWallet } from "@/lib/cdp";

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      client: publicClient,
    });

    const decimals = await tokenContract.read.decimals();
    return Number(decimals);
  } catch (error) {
    console.warn(`Failed to fetch decimals for ${tokenAddress}, using 18:`, error);
    return 18; // Default fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sellToken, buyToken, sellAmount, userAddress, spendCalls } = await req.json();
    if (!sellToken || !buyToken || !sellAmount || !userAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // get token decimals and convert sellAmount to base units should be handled inside getSwapQuote
    const sellTokenDecimals = await getTokenDecimals(sellToken);

    // Convert sellAmount from human-readable to base units (wei)
    const sellAmountInBaseUnits = parseUnits(sellAmount.toString(), sellTokenDecimals);

    const serverWallet = await getServerWallet();

    if (!serverWallet.smartAccount) {
      return NextResponse.json({ error: "Server wallet is not properly set up" }, { status: 500 });
    }

    // execute spend calls first
    const cdpClient = getCdpClient();
    try {
      console.log("🔧 Sending user operation with spend calls:", spendCalls);
      await cdpClient.evm.sendUserOperation({
        smartAccount: serverWallet.smartAccount,
        network: "base",
        calls: spendCalls.map((call: any) => ({
          to: call.to,
          data: call.data,
        })),
        paymasterUrl: process.env.PAYMASTER_URL,
      });
    } catch (e) {
      console.error("❌ Error executing spend calls:", e);
    }

    // get swap quote
    console.log("🔧 Fetching swap quote...");
    const quote = await getSwapQuote(
      sellToken,
      buyToken,
      sellAmountInBaseUnits.toString(),
      serverWallet.smartAccount.address
    );

    console.log("swap quote", quote);

    // check if taker needs to set an allowance for AllowanceHolder
    if (quote.issues.allowance !== null) {
      const allowanceHolderApprovalReceipt = await approveAllowanceHolderSpend(
        sellToken as `0x${string}`,
        quote.issues.allowance.spender as `0x${string}`
      );

      console.log("✅ AllowanceHolder approval transaction mined:", allowanceHolderApprovalReceipt);
    }

    // create swap transaction with retry logic
    let swapTransaction;
    let receipt;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔧 Swap attempt ${attempt}/${maxRetries}...`);
        
        swapTransaction = await cdpClient.evm.sendUserOperation({
          smartAccount: serverWallet.smartAccount,
          network: "base",
          calls: [
            {
              to: quote.transaction.to as `0x${string}`,
              data: quote.transaction.data,
            },
            {
              // transfer output tokens to userAddress
              to: buyToken as `0x${string}`,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "transfer",
                args: [userAddress as `0x${string}`, quote.buyAmount as bigint],
              }) as `0x${string}`,
            },
          ],
          paymasterUrl: process.env.PAYMASTER_URL,
        });

        console.log(`✅ Swap transaction sent (attempt ${attempt}):`, swapTransaction);

        receipt = await serverWallet.smartAccount.waitForUserOperation({
          userOpHash: swapTransaction.userOpHash,
        });
        
        console.log(`✅ Swap transaction receipt (attempt ${attempt}):`, receipt);
        break; // Success, exit retry loop
        
      } catch (error) {
        console.error(`❌ Swap attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error("❌ All swap attempts failed, throwing error");
          throw error; // Re-throw on final attempt
        } else {
          console.log(`🔄 Retrying swap in 2 seconds... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }
      }
    }

    return NextResponse.json({ receipt, quote });
  } catch (error: any) {
    console.error("❌ /api/swap/execute error:", error);
    return NextResponse.json({ error: "Failed to fetch swap quote" }, { status: 500 });
  }
}
