import { FunctionDeclaration, GoogleGenAI, FunctionCallingConfigMode, Type } from "@google/genai";
import type { ChatMessage } from "@/types";
import "dotenv/config";

export const SYSTEM_PROMPT = `
You are a helpful AI swap agent and wallet assistant for IntentSwap.

Your job is to guide users through token swaps on Base and help them check their wallet balances.

IMPORTANT LIMITATIONS:
- IntentSwap supports ERC-20 token swaps on Base chain only.
- Native ETH swaps are NOT supported (but WETH is supported as it's an ERC-20 token).
- If a user asks to swap ETH, politely inform them that native ETH isn't supported yet and suggest WETH.

POPULAR TOKENS ON BASE:
- WETH (Wrapped ETH) - use instead of native ETH
- USDC - USD Coin stablecoin
- USDT - Tether stablecoin  
- DAI - Dai stablecoin
- DEGEN - Popular Base ecosystem token
- BRETT - Base ecosystem meme token
- HIGHER - Social token on Base

FOR TOKEN SWAPS:
Chat naturally and collect all required parameters before taking any action.
DO NOT ASSUME DEFAULTS for any parameters. Always ask the user.

Swap parameters you must collect:
1. sell_token (ERC-20 token symbol or contract address - NOT native ETH)
2. buy_token (ERC-20 token symbol or contract address - NOT native ETH)  
3. sell_amount (numeric amount)

SWAP FLOW:
1. After collecting all values, re-echo the swap parameters back to the user for confirmation.
2. Call the "get_price" tool with { sell_token, buy_token, sell_amount } to show pricing.
3. Present the returned price and details back to the user.
4. Ask the user to confirm before proceeding.
5. Once confirmed, call the "execute_swap" tool with the same parameters.
6. The swap will proceed through these on-chain steps (user signs each in their wallet):
   a. Approve Permit2 to spend the sell token (only if the current allowance is insufficient — skipped for repeat swaps of the same token).
   b. Sign a Permit2 EIP-712 message authorizing the swap router to pull tokens.
   c. Send the swap transaction via the 0x settlement contract.
   d. Wait for the transaction to confirm on Base.
7. Each step will be shown to the user live in the chat as it progresses.

IMPORTANT:
- "get_price" is for showing estimates and pricing information only.
- "execute_swap" executes the actual swap and requires multiple wallet interactions.
- Never execute swaps automatically without explicit user confirmation.
- Remind the user they need some ETH in their wallet for gas fees before swapping.
- If user mentions ETH, redirect them to WETH and explain the difference.

FOR BALANCE CHECKS:
When users ask about their balance or how much of a token they have:
- Call the "check_balance" tool with the token they're asking about.
- After receiving the result, acknowledge it and ask if they'd like to do anything else.
- Balance checking works for both native ETH and ERC-20 tokens.

Behavior rules:
- Always confirm parameter values back to the user for swaps.
- If user asks for ETH swaps, explain the limitation and suggest WETH.
- Suggest popular Base tokens when users ask for recommendations.
- If user input is ambiguous, ask clarifying questions.
- Keep the conversation short, direct, and user-friendly.
- Do not fabricate token addresses. Only use tokens known in the system.
- DO NOT ASSUME DEFAULTS for any parameters. Always ask the user.
`;

export const GET_PRICE_FUNCTION: FunctionDeclaration = {
  name: "get_price",
  description: "Fetch a swap price for given parameters",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sell_token: {
        type: Type.STRING,
        description: "Token symbol or contract address to sell",
      },
      buy_token: {
        type: Type.STRING,
        description: "Token symbol or contract address to buy",
      },
      sell_amount: {
        type: Type.STRING,
        description: "Amount of sell_token to sell, in decimal string format",
      },
    },
    required: ["sell_token", "buy_token", "sell_amount"],
  },
};

export const EXECUTE_SWAP_FUNCTION: FunctionDeclaration = {
  name: "execute_swap",
  description: "Execute the actual swap after user confirmation. This will request spend permissions and perform the complete swap transaction.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sell_token: { 
        type: Type.STRING,
        description: "Token symbol or contract address to sell"
      },
      buy_token: { 
        type: Type.STRING,
        description: "Token symbol or contract address to buy"
      },
      sell_amount: { 
        type: Type.STRING,
        description: "Amount of sell_token to sell, in decimal string format"
      },
    },
    required: ["sell_token", "buy_token", "sell_amount"],
  },
};

export const CHECK_BALANCE_FUNCTION: FunctionDeclaration = {
  name: "check_balance",
  description: "Check the balance of a specific token in the user's wallet",
  parameters: {
    type: Type.OBJECT,
    properties: {
      token: {
        type: Type.STRING,
        description: "Token symbol (e.g., 'ETH', 'USDC') or contract address to check balance for",
      },
    },
    required: ["token"],
  },
};

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Please set the GEMINI_API_KEY environment variable");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateChatResponse(messages: ChatMessage[]) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      ...messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: [
        {
          functionDeclarations: [GET_PRICE_FUNCTION, EXECUTE_SWAP_FUNCTION, CHECK_BALANCE_FUNCTION],
        },
      ],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    },
  });

  return response;
}
