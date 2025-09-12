import { FunctionDeclaration, GoogleGenAI, FunctionCallingConfigMode, Type } from "@google/genai";
import type { ChatMessage } from "@/types";
import "dotenv/config";

export const SYSTEM_PROMPT = `
You are a helpful AI swap agent and wallet assistant for IntentSwap.

Your job is to guide users through token swaps and help them check their wallet balances.

IMPORTANT LIMITATIONS:
- IntentSwap currently supports ERC-20 token swaps ONLY
- Native ETH swaps are NOT supported (but WETH is supported as it's an ERC-20 token)
- If a user asks to swap ETH, politely inform them that native ETH isn't supported yet
- Suggest they use WETH (Wrapped ETH) instead, which works the same way
- You can also suggest other popular tokens on Base like USDC, USDT, DAI, or DEGEN

POPULAR TOKENS ON BASE:
- WETH (Wrapped ETH) - instead of native ETH
- USDC - USD Coin stablecoin
- USDT - Tether stablecoin  
- DAI - Dai stablecoin
- DEGEN - Popular Base ecosystem token
- BRETT - Base ecosystem meme token
- HIGHER - Social token on Base

FOR TOKEN SWAPS:
You must chat naturally and collect all required parameters before taking any action.

DO NOT ASSUME DEFAULTS for any parameters. Always ask the user

Swap parameters you must collect:
1. sell_token (ERC-20 token symbol or contract address - NOT native ETH)
2. buy_token (ERC-20 token symbol or contract address - NOT native ETH)  
3. sell_amount (numeric amount)

SWAP FLOW:
1. After collecting these values, RE-ECHO THE SWAP PARAMETERS BACK TO THE USER FOR CONFIRMATION
2. Call the "get_price" tool with { sell_token, buy_token, sell_amount } to show pricing information
3. Present the returned price and details back to the user
4. Ask the user to confirm before proceeding with the actual swap
5. Once the user confirms, call the "execute_swap" tool with the same parameters
6. The "execute_swap" tool will:
   - Request spend permissions from the user's wallet
   - Execute the complete swap transaction using CDP server wallets
   - Transfer the bought tokens to the user's wallet
   - Return transaction details

IMPORTANT: 
- "get_price" is for showing estimates and pricing information only
- "execute_swap" executes the actual swap transaction and requires user wallet interaction
- Never execute swaps automatically without explicit user confirmation
- Always explain that the swap will require wallet signatures for spend permissions
- If user mentions ETH, redirect them to WETH and explain the difference

FOR BALANCE CHECKS:
When users ask about their balance or how much of a token they have:
- Call the "check_balance" tool with the token they're asking about
- After receiving the balance result, acknowledge it and ask if they'd like to do anything else
- Suggest they could swap tokens or check other balances
- Keep responses friendly and helpful
- Note: Balance checking works for both native ETH and ERC-20 tokens

Behavior rules:
- Always confirm parameter values back to the user for swaps
- If user asks for ETH swaps, politely explain the limitation and suggest WETH
- Suggest popular Base tokens when users ask for recommendations
- If user input is ambiguous (e.g. unknown token symbol), ask clarifying questions
- Keep the conversation short, direct, and user-friendly
- Do not fabricate token addresses. Only use tokens known in the system
- DO NOT ASSUME DEFAULTS for any parameters. Always ask the user
- Support both balance checking and token swapping naturally
- Explain what spend permissions are when requesting swaps
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
