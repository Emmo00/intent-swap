import { createPublicClient, http, formatUnits, zeroAddress } from "viem";
import { base } from "viem/chains";

// Create a public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function getTokenBalance(tokenAddress: string, userAddress: `0x${string}`) {
  if (!tokenAddress || !userAddress) return "0";

  try {
    // Handle ETH balance separately
    if (tokenAddress.toLowerCase() === zeroAddress) {
      const balance = await publicClient.getBalance({ address: userAddress });
      return formatUnits(balance, 18); // ETH has 18 decimals
    }

    // Read the balance using the standard ERC20 balanceOf function
    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [userAddress],
    });

    // read token's decimals
    const tokenDecimals = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        {
          type: "function",
          name: "decimals",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint8" }],
        },
      ],
      functionName: "decimals",
      args: [],
    });

    // Format the balance using the token's known decimals
    const formattedBalance = formatUnits(balance as bigint, tokenDecimals);

    return formattedBalance;
  } catch (error) {
    console.error(`Error getting balance for ${tokenAddress}:`, error);
    return "0";
  }
}
