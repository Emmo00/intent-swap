export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatSession {
  _id?: string
  sessionId: string
  userId?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatRequest {
  sessionId: string
  role: 'user' | 'model'
  message: string
}

export interface ChatResponse {
  success: boolean
  sessionId: string
  message: ChatMessage
  aiResponse?: ChatMessage
  rawAiResponse?: any
  error?: string
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface SwapQuote {
  sell_token: string;
  buy_token: string;
  sell_amount: string;
  buy_amount: string;
  price: string;
  gas_estimate: string;
  allowance_target?: string;
  to?: string;
  data?: string;
}

export interface SwapPrice {
  sell_token: string;
  buy_token: string;
  sell_amount: string;
  buy_amount: string;
  price: string;
  estimated_gas: string;
}

export interface ServerWallet {
  address: string
  walletClient: any
  account: any
  smartAccount?: any
}
