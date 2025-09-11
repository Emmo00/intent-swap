import { base } from "viem/chains";
import {
  createWalletClient,
  http,
  getContract,
  erc20Abi,
  parseUnits,
  maxUint256,
  publicActions,
} from "viem";

const { ZERO_EX_API_KEY } = process.env;
if (!ZERO_EX_API_KEY) {
  throw new Error("Missing ZERO_EX_API_KEY in environment variables");
}

// fetch headers
const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZERO_EX_API_KEY,
  "0x-version": "v2",
});

const client = createWalletClient({ chain: base, transport: http() });

function getERC20Contract(address: `0x${string}`) {
  return getContract({
    address,
    abi: erc20Abi,
    client,
  });
}

export async function getSwapPrice(sellToken: string, buyToken: string, sellAmount: string) {
  const priceParams = new URLSearchParams({
    chainId: client.chain.id.toString(),
    sellToken: sellToken,
    buyToken: buyToken,
    sellAmount: sellAmount.toString(),
  });

  const priceResponse = await fetch(
    "https://api.0x.org/swap/allowance-holder/price?" + priceParams.toString(),
    {
      headers,
    }
  );

  if (!priceResponse.ok) {
    throw new Error(`Failed to fetch price: ${await priceResponse.text()}`);
  }

  const priceData = await priceResponse.json();
  return priceData;
}

export async function getSwapQuote(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  userAddress: `0x${string}`
) {
  const quoteParams = new URLSearchParams({
    chainId: client.chain.id.toString(),
    sellToken: sellToken,
    buyToken: buyToken,
    sellAmount: sellAmount.toString(),
    takerAddress: userAddress,
  });

  const quoteResponse = await fetch(
    "https://api.0x.org/swap/allowance-holder/quote?" + quoteParams.toString(),
    {
      headers,
    }
  );

  if (!quoteResponse.ok) {
    throw new Error(`Failed to fetch quote: ${await quoteResponse.text()}`);
  }

  const quoteData = await quoteResponse.json();
  return quoteData;
}
