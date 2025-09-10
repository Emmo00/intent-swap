import { FunctionDeclaration, GoogleGenAI, FunctionCallingConfigMode, Type } from "@google/genai";
import type { ChatMessage } from "@/types";
import "dotenv/config";

export const SYSTEM_PROMPT = `
You are a helpful AI swap agent.

Your job is to guide a user through the process of creating a token swap. 
You must chat naturally and collect all required parameters before taking any action.

DO NOT ASSUME DEFAULTS for any parameters. Always ask the user

Parameters you must collect:
1. sell_token (token symbol or contract address)
2. buy_token (token symbol or contract address)
3. sell_amount (numeric amount)

After collecting these values:
- RE ECHO THE SWAP PARAMETERS BACK TO THE USER FOR CONFIRMATION
- Call the "get_price" tool with { sell_token, buy_token, sell_amount }
- Present the returned price and details back to the user
- Ask the user to confirm before proceeding
- Once the user confirms, call the "get_quote" tool with the same parameters
- Never execute swaps automatically without confirmation
- DO NOT ASSUME DEFAULTS for any parameters. Always ask the user

Behavior rules:
- Always confirm parameter values back to the user
- If user input is ambiguous (e.g. unknown token symbol), ask clarifying questions
- Keep the conversation short, direct, and user-friendly
- Do not fabricate token addresses. Only use tokens known in the system
- DO NOT ASSUME DEFAULTS for any parameters. Always ask the user
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

export const GET_QUOTE_FUNCTION = {
  name: "get_quote",
  description: "Get a final executable swap quote after user confirmation",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sell_token: { type: Type.STRING },
      buy_token: { type: Type.STRING },
      sell_amount: { type: Type.STRING },
    },
    required: ["sell_token", "buy_token", "sell_amount"],
  },
};

console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
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
          functionDeclarations: [GET_PRICE_FUNCTION, GET_QUOTE_FUNCTION],
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
