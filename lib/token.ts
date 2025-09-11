import { setOnchainKitConfig } from "@coinbase/onchainkit";
import { getTokens } from "@coinbase/onchainkit/api";
import { getERC20Contract } from "./swap";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";

setOnchainKitConfig({ apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY! });

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export async function getTokenContractByNameOrSymbol(name: string) {
  const tokens = await getTokens({ limit: "1", search: name });

  return Array.isArray(tokens) && tokens.length > 0 ? tokens[0] : null;
}

export async function getTokenBalance(tokenIdentifier: string, userAddress: `0x${string}`) {
  if (!tokenIdentifier || !userAddress) return "0";

  try {
    // Handle ETH balance separately
    if (tokenIdentifier.toLowerCase() === 'eth' || tokenIdentifier.toLowerCase() === 'ethereum') {
      const balance = await publicClient.getBalance({ address: userAddress });
      return formatUnits(balance, 18); // ETH has 18 decimals
    }

    // For other tokens, first get token info
    const token = await getTokenContractByNameOrSymbol(tokenIdentifier);

    if (!token) {
      console.warn(`Token not found: ${tokenIdentifier}`);
      return "0";
    }

    // Get the token contract
    const tokenContract = getERC20Contract(token.address as `0x${string}`);

    // Read the balance
    const balance = await publicClient.readContract({
      address: token.address as `0x${string}`,
      abi: [
        {
          type: 'function',
          name: 'balanceOf',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
        {
          type: 'function',
          name: 'decimals',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        }
      ],
      functionName: 'balanceOf',
      args: [userAddress],
    });

    // Get token decimals
    const decimals = await publicClient.readContract({
      address: token.address as `0x${string}`,
      abi: [
        {
          type: 'function',
          name: 'decimals',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        }
      ],
      functionName: 'decimals',
    });

    // Format the balance using the token's decimals
    const formattedBalance = formatUnits(balance as bigint, decimals as number);
    
    return formattedBalance;

  } catch (error) {
    console.error(`Error getting balance for ${tokenIdentifier}:`, error);
    return "0";
  }
}