import { NextRequest, NextResponse } from "next/server";
import { approvePermit2TokenSpend, getSwapQuote } from "../../../../lib/swap";
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

    // get swap quote
    console.log("🔧 Fetching swap quote...");
    const quote = await getSwapQuote(
      sellToken,
      buyToken,
      sellAmountInBaseUnits.toString(),
      userAddress
    );

    console.log("swap quote", quote);

    if (quote.issues.allowance !== null) {
      // approve permit2 contract to spend token
      const permit2ApprovalReceipt = await approvePermit2TokenSpend(
        sellToken as `0x${string}`,
        quote.issues.allowance.spender as `0x${string}`
      );

      console.log("✅ Permit2 approval transaction mined:", permit2ApprovalReceipt);
    }

    // sign permit2.eip712 returned from quote
    let signature: `0x${string}` | undefined = undefined;

    if (quote?.permit2?.eip712) {
      signature = await serverWallet.walletClient.signTypedData(quote.permit2.eip712);
      console.log("✅ Permit2 signed:", signature);
    }

    // append sig length and sig data to transaction.data
    if (signature && quote?.transaction?.data) {
      const signatureLengthInHex = numberToHex(size(signature), {
        signed: false,
        size: 32,
      });

      const transactionData = quote.transaction.data as Hex;
      const sigLengthHex = signatureLengthInHex as Hex;
      const sig = signature as Hex;

      quote.transaction.data = concat([transactionData, sigLengthHex, sig]);
    } else {
      throw new Error("Failed to obtain signature or transaction data");
    }

    // create swap transaction
    const swapTransaction = await cdpClient.evm.sendUserOperation({
      smartAccount: serverWallet.smartAccount,
      network: "base",
      calls: [
        {
          to: quote.transaction.to as `0x${string}`,
          data: quote.transaction.data,
        },
      ],
      paymasterUrl: process.env.PAYMASTER_URL,
    });

    console.log("✅ Swap transaction mined:", swapTransaction);

    const receipt = await serverWallet.smartAccount.waitForUserOperation({
      userOpHash: swapTransaction.userOpHash,
    });

    return NextResponse.json({ receipt, quote });
  } catch (error: any) {
    console.error("❌ /api/swap/execute error:", error);
    return NextResponse.json({ error: "Failed to fetch swap quote" }, { status: 500 });
  }
}
