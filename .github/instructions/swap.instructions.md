---
applyTo: '**'
---

# Swap API Instructions


# overview

- frontend request spend permission for sell token and amount
- frontend calls backend swap
- in the backend swap the following happens:
  - call 0x api to get quote
  - execute spend permission user op
  - prepare permit2 signature request
  - execute swap user op with paymaster
- return transaction hash to frontend

## Flow

this flow is initiated after the user has specified the user's desired swap parameters (sell token, buy token, sell amount) and the agent has returned a function call to "execute_swap". The following are the steps for implementing the full swap.

- **Get Spend Permissions**: Frontend calls `requestSpendPermission` on their base account using the sdk with parameters: `{ account: user, spender: smartAccountAddress (server smart wallet account), token: sell_token, chainId: 8453, allowance: sell_amount (in base units), periodInDays: 1 }`.
- Store returned permission JSON in `localStorage` (`spendPermission`).
- after successful permission grant, call backend API `/api/swap/quote` with parameters: `{ sellToken: sell_token, buyToken: buy_token, sellAmount: sell_amount (formatted) }`.

- Backend calls 0x API `/swap/permit2/quote` with the same parameters using the helper function in `lib/swap.ts`.


this is an example response from the 0x permit2 endpoint for swapping.

```json
{
  "allowanceTarget": "0x000000000022d473030f116ddee9f6b43ac78ba3",
  "blockNumber": "20114692",
  "buyAmount": "100037537",
  "buyToken": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "fees": {
    "integratorFee": null,
    "zeroExFee": null,
    "gasFee": null
  },
  "issues": {
    "allowance": {
      "actual": "0",
      "spender": "0x000000000022d473030f116ddee9f6b43ac78ba3"
    },
    "balance": {
      "token": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "actual": "0",
      "expected": "100000000"
    },
    "simulationIncomplete": false,
    "invalidSourcesPassed": []
  },
  "liquidityAvailable": true,
  "minBuyAmount": "99037162",
  "permit2": {
    "type": "Permit2",
    "hash": "0xab0c8909f2f8daed2891abb5e93762c65787e0067ef2ab9184bb635ad0f3df51",
    "eip712": {
      "types": {
        "PermitTransferFrom": [
          {
            "name": "permitted",
            "type": "TokenPermissions"
          },
          {
            "name": "spender",
            "type": "address"
          },
          {
            "name": "nonce",
            "type": "uint256"
          },
          {
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "TokenPermissions": [
          {
            "name": "token",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          }
        ],
        "EIP712Domain": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "chainId",
            "type": "uint256"
          },
          {
            "name": "verifyingContract",
            "type": "address"
          }
        ]
      },
      "domain": {
        "name": "Permit2",
        "chainId": 1,
        "verifyingContract": "0x000000000022d473030f116ddee9f6b43ac78ba3"
      },
      "message": {
        "permitted": {
          "token": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "amount": "100000000"
        },
        "spender": "0x7f6cee965959295cc64d0e6c00d99d6532d8e86b",
        "nonce": "2241959297937691820908574931991575",
        "deadline": "1718669420"
      },
      "primaryType": "PermitTransferFrom"
    }
  },
  "route": {
    "fills": [
      {
        "from": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "to": "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "source": "SolidlyV3",
        "proportionBps": "10000"
      }
    ],
    "tokens": [
      {
        "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "symbol": "USDC"
      },
      {
        "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "symbol": "USDT"
      }
    ]
  },
  "sellAmount": "100000000",
  "sellToken": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "tokenMetadata": {
    "buyToken": {
      "buyTaxBps": "0",
      "sellTaxBps": "0"
    },
    "sellToken": {
      "buyTaxBps": "0",
      "sellTaxBps": "0"
    }
  },
  "totalNetworkFee": "1393685870940000",
  "transaction": {
    "to": "0x7f6cee965959295cc64d0e6c00d99d6532d8e86b",
    "data": "0x1fff991f00000000000000000000000070a9f34f9b34c64957b9c401a97bfed35b95049e000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000000000000000000000000000000000000005e72fea00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000144c1fb425e0000000000000000000000007f6cee965959295cc64d0e6c00d99d6532d8e86b000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000005f5e1000000000000000000000000000000000000006e898131631616b1779bad70bc17000000000000000000000000000000000000000000000000000000006670d06c00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016438c9c147000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000027100000000000000000000000006146be494fee4c73540cb1c5f87536abf1452500000000000000000000000000000000000000000000000000000000000000004400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000084c31b8d7a0000000000000000000000007f6cee965959295cc64d0e6c00d99d6532d8e86b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000001000276a40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "gas": "288079",
    "gasPrice": "4837860000",
    "value": "0"
  },
  "zid": "0x111111111111111111111111"
}
```

- backend  Execute prepared spend-permission calls (from frontend) via `cdpClient.evm.sendUserOperation`.

- backend prepares a permit2 signature request with the helper function in `lib/swap.ts`.

- the backend executes the swap by creating a transaction with the paymaster url and parameters from the quote response.

- the backend wait for the user ops to be mined and returns the transaction hash to the frontend.

# examples

here is an example script that executes swap:

```typescript
import { config as dotenv } from "dotenv";
import {
  createWalletClient,
  http,
  getContract,
  erc20Abi,
  parseUnits,
  maxUint256,
  publicActions,
  concat,
  numberToHex,
  size,
} from "viem";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { usdcAbi } from "./abi/usdc-abi";

const qs = require("qs");

// load env vars
dotenv();
const { PRIVATE_KEY, ZERO_EX_API_KEY, ALCHEMY_HTTP_TRANSPORT_URL } =
  process.env;

// validate requirements
if (!PRIVATE_KEY) throw new Error("missing PRIVATE_KEY.");
if (!ZERO_EX_API_KEY) throw new Error("missing ZERO_EX_API_KEY.");
if (!ALCHEMY_HTTP_TRANSPORT_URL)
  throw new Error("missing ALCHEMY_HTTP_TRANSPORT_URL.");

// fetch headers
const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZERO_EX_API_KEY,
  "0x-version": "v2",
});

// setup wallet client
const client = createWalletClient({
  account: privateKeyToAccount(`0x${PRIVATE_KEY}` as `0x${string}`),
  chain: base,
  transport: http(ALCHEMY_HTTP_TRANSPORT_URL),
}).extend(publicActions);

const [address] = await client.getAddresses();

// Contract addresses for Base network
const CONTRACTS = {
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
} as const;

// set up contracts
const eth = getContract({
  address: CONTRACTS.ETH,
  abi: erc20Abi,
  client,
});

const weth = getContract({
  address: CONTRACTS.WETH,
  abi: erc20Abi,
  client,
});

const usdc = getContract({
  address: CONTRACTS.USDC,
  abi: usdcAbi,
  client,
});

type TokenType = "ETH" | "WETH";

const executeSwap = async (sellTokenType: TokenType) => {
  const sellToken = sellTokenType === "ETH" ? eth : weth;
  let sellAmount;

  // handle ETH separately (no need to call decimals on ETH)
  if (sellToken.address === CONTRACTS.ETH) {
    sellAmount = parseUnits("0.0001", 18); // ETH has 18 decimals
  } else {
    // specify sell amount for ERC-20 tokens
    sellAmount = parseUnits("0.0001", await sellToken.read.decimals());
  }

  // 1. fetch price
  const priceParams = new URLSearchParams({
    chainId: client.chain.id.toString(),
    sellToken: sellToken.address,
    buyToken: CONTRACTS.USDC,
    sellAmount: sellAmount.toString(),
    taker: client.account.address,
  });

  const priceResponse = await fetch(
    "https://api.0x.org/swap/permit2/price?" + priceParams.toString(),
    { headers }
  );

  const price = await priceResponse.json();
  console.log(`Fetching price to swap 0.0001 ${sellTokenType} for USDC`);
  console.log(
    `https://api.0x.org/swap/permit2/price?${priceParams.toString()}`
  );
  console.log("priceResponse: ", price);

  // 2. Check if the sellToken is a native token (ETH) to skip allowance
  if (sellToken.address === CONTRACTS.ETH) {
    console.log("Native token detected, no need for allowance check");
  } else {
    // Check if allowance is required
    if (price.issues.allowance !== null) {
      try {
        const { request } = await sellToken.simulate.approve([
          price.issues.allowance.spender,
          maxUint256,
        ]);
        console.log("Approving Permit2 to spend sellToken...", request);
        // set approval
        const hash = await sellToken.write.approve(request.args);
        console.log(
          "Approved Permit2 to spend sellToken.",
          await client.waitForTransactionReceipt({ hash })
        );
      } catch (error) {
        console.log("Error approving Permit2:", error);
      }
    } else {
      console.log("sellToken already approved for Permit2");
    }
  }

  // 3. fetch quote
  const quoteParams = new URLSearchParams();
  for (const [key, value] of priceParams.entries()) {
    quoteParams.append(key, value);
  }

  const quoteResponse = await fetch(
    "https://api.0x.org/swap/permit2/quote?" + quoteParams.toString(),
    { headers }
  );

  const quote = await quoteResponse.json();
  console.log(`Fetching quote to swap 0.0001 ${sellTokenType} for USDC`);
  console.log("quoteResponse: ", quote);

  // 4. sign permit2.eip712 returned from quote
  let signature: Hex | undefined;
  if (quote.permit2?.eip712) {
    try {
      signature = await client.signTypedData(quote.permit2.eip712);
      console.log("Signed permit2 message from quote response");
    } catch (error) {
      console.error("Error signing permit2 coupon:", error);
    }

    // 5. append sig length and sig data to transaction.data
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
  }

  // 6. submit txn with permit2 signature
  const nonce = await client.getTransactionCount({
    address: client.account.address,
  });

  // Check if it's a native token (like ETH)
  if (sellToken.address === CONTRACTS.ETH) {
    // Directly sign and send the native token transaction
    const transaction = await client.sendTransaction({
      account: client.account,
      chain: client.chain,
      gas: !!quote?.transaction.gas
        ? BigInt(quote?.transaction.gas)
        : undefined,
      to: quote?.transaction.to,
      data: quote.transaction.data,
      value: BigInt(quote.transaction.value),
      gasPrice: !!quote?.transaction.gasPrice
        ? BigInt(quote?.transaction.gasPrice)
        : undefined,
      nonce: nonce,
    });

    console.log("Transaction hash:", transaction);
    console.log(`See tx details at https://basescan.org/tx/${transaction}`);
  } else if (signature && quote.transaction.data) {
    // Handle ERC-20 token case (requires signature)
    const signedTransaction = await client.signTransaction({
      account: client.account,
      chain: client.chain,
      gas: !!quote?.transaction.gas
        ? BigInt(quote?.transaction.gas)
        : undefined,
      to: quote?.transaction.to,
      data: quote.transaction.data,
      gasPrice: !!quote?.transaction.gasPrice
        ? BigInt(quote?.transaction.gasPrice)
        : undefined,
      nonce: nonce,
    });

    const hash = await client.sendRawTransaction({
      serializedTransaction: signedTransaction,
    });

    console.log("Transaction hash:", hash);
    console.log(`See tx details at https://basescan.org/tx/${hash}`);
  } else {
    console.error("Failed to obtain a signature, transaction not sent.");
  }
};

const main = async () => {
  try {
    // Execute ETH to USDC swap
    console.log("Executing ETH to USDC swap...");
    await executeSwap("ETH");

    // Wait a few blocks before executing the next transaction
    console.log("Waiting before executing next swap...");
    await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait 15 seconds

    // Execute WETH to USDC swap
    console.log("\nExecuting WETH to USDC swap...");
    await executeSwap("WETH");
  } catch (error) {
    console.error("Error executing swaps:", error);
  }
};

main();
```
