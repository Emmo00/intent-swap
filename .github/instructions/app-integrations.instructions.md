---
applyTo: '**'
---
# Project Engineering Instructions (For Copilot & Contributors)

Focused domains:
1. Base Account SDK usage & auth (Sign In, spend permissions)
2. CDP server wallets & smart accounts (gas sponsorship, swaps, user ops)
3. Natural language agent (currently OpenAI; adaptable to Google Gemini)
4. Spend Permission lifecycle (request, query, status, prepare, revoke) across Base accounts & CDP smart accounts

These notes codify existing patterns so generated code stays consistent and secure.

---
## 1. Base Account SDK Integration

Key package: `@base-org/account`

Primary usage patterns:
- Instantiate once where needed (client side) using `createBaseAccountSDK({ appName })` then `getProvider()`.
- Sign-in flow (`SignInWithBaseButton`):
  1. GET `/api/auth/verify` to obtain a nonce.
  2. `eth_requestAccounts` then ensure chain is Base Mainnet (`wallet_switchEthereumChain` with `0x2105`).
  3. Attempt `wallet_connect` with `signInWithEthereum` capability (preferred SIWE path) else fallback to manual `personal_sign`.
  4. POST signature payload to `/api/auth/verify` for server-side validation; server sets `session` cookie (base64 of address + timestamp). (Production: replace with signed JWT.)

Server verification (`/api/api/auth/verify/route.ts`):
- Maintains ephemeral nonce Set (replace with Redis/DB in prod).
- Uses `viem` `verifyMessage` for signature.

When adding new auth-requiring API routes:
- Always extract & validate session cookie.
- Decode user address: `Buffer.from(session,'base64').toString().split(':')[0]`.
- Return 401 on missing/invalid.

Do NOT duplicate provider instantiation server-side for wallet auth; provider is only needed client side for user signature actions.

---
## 2. CDP Server Wallets & Smart Accounts

Key package: `@coinbase/cdp-sdk` (see `src/lib/cdp.ts`).

Pattern:
- Lazy singleton `CdpClient` via `getCdpClient()`.
- Per user: create ephemeral server wallet (CDP EOA) + associated CDP smart account for sponsored user operations.
- Cache in `globalThis.__serverWallets` (Map keyed by user address) to survive Next.js dev hot reloads.
- Each entry stores: `{ address, walletClient (viem), account (CDP), smartAccount }`.
- Gas sponsorship: pass `paymasterUrl: process.env.PAYMASTER_URL` to each `sendUserOperation` / `swap` call.

Creating or retrieving:
- API `/api/wallet/create` ensures existence and returns both raw server wallet address and smart account address (spender for spend permissions).

User Operation Flow (example in `/api/zora/buy`):
1. Execute prepared spend-permission calls (from frontend) via `cdpClient.evm.sendUserOperation`.
2. Approve Permit2 (USDC) if needed (manual calldata, selector `0x095ea7b3`).
3. Perform swap using `smartAccount.swap({ fromToken, toToken, fromAmount, slippageBps, paymasterUrl })` with retry loop.
4. After completion: `smartAccount.waitForUserOperation({ userOpHash })` until `status === 'complete'`.
5. Transfer resulting ERC20 (creator coin) to user with another user op (manual `transfer` calldata `0xa9059cbb`).

When adding new on-chain actions:
- Prefer high-level CDP SDK helpers if available (swap, bridge, etc.).
- Keep approval & swap distinct transactions unless atomic support exists.
- Always map returned `calls` to `{ to, data }` only (omit extraneous fields) when using `sendUserOperation`.
- Include retry & minimal backoff for unstable network interactions.

Security considerations:
- Never persist private keys locally—CDP manages custody.
- Treat server wallet Map as ephemeral; gracefully handle missing smartAccount (prompt user to re-init spend permissions).

---
## 3. Spend Permissions (Core UX Primitive)

Key functions from `@base-org/account/spend-permission`:
- `requestSpendPermission` – user-signed creation of permission.
- `fetchPermissions` – enumerate existing permissions.
- `getPermissionStatus` – remaining spend vs allowance / period.
- `prepareSpendCallData` – constructs low-level calls to consume permission (frontend side for transparency & user control).
- `requestRevoke` – user-signed revocation.

Token: USDC on Base `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` (normalize casing when comparing!). Chain ID: `8453`.

Lifecycle Implementation:
1. Frontend (user authenticated) calls `/api/wallet/create` to ensure a server smart account (spender) exists.
2. Frontend calls `requestSpendPermission` with parameters: `{ account: user, spender: smartAccountAddress, token: USDC, chainId: 8453, allowance: dailyUSD * 1e6, periodInDays: 1 }`.
3. Store returned permission JSON in `localStorage` (`spendPermission`).
4. When executing an AI tool action (buy coin):
   - Load permission; call `getPermissionStatus(permission)`.
   - Validate `remainingSpend >= requiredAmount`.
   - `prepareSpendCallData(permission, requiredAmount)` to obtain array of calls.
   - POST calls to backend (`/api/zora/buy`). Backend trusts only the spend calls shape and executes them via smart account sponsorship.
5. Revocation: UI loads `fetchPermissions` via helper wrapper `getUserSpendPermissions` and calls `requestRevoke`.

Guidelines:
- Always compute USD->USDC with integer math: `BigInt(Math.floor(amountUSD * 1_000_000))`.
- Filter permissions by token address (lowercase comparison) to avoid mixing tokens.
- Keep daily limit small in demos ($1–$2) to reduce risk.
- Surface truncated `permissionHash` for user reference.

Extending spend permissions:
- For multi-token: add mapping of symbol->address; when fetching, filter for all relevant tokens.
- For variable periods: expose `periodInDays` selector; remember downstream UI status calculations.
- For server-side auditing: persist permission metadata (account, spender, token, allowance, start/end, signature) in DB.

---
## 4. Natural Language Agent (OpenAI → Gemini Adaptation)

Current implementation: `src/lib/openai.ts` using `openai.chat.completions.create` with function calling (tool spec `ZORA_BUY_FUNCTION`).

Migration strategy for Google Gemini (high-level):
1. Replace OpenAI client with Gemini SDK import (e.g., `@google/generative-ai`).
2. Recreate system prompt as the initial instruction or use `safetySettings` / `systemInstruction` depending on SDK.
3. Implement an abstraction layer: `generateAgentResponse(messages, tools)` returning a normalized shape `{ message, toolCall? }`.
4. Parse Gemini tool invocation (Gemini uses function calling via `tools` & `functionDeclarations`). Map to existing handling path in `/api/chat`.
5. Keep token budgeting similar (`max_output_tokens`).
6. Ensure streaming fallback: implement both non-stream and stream wrappers if needed.

Copilot rule: Do not entangle model-specific code with business logic; isolate in `src/lib/ai` (create new file) if adding Gemini. Maintain backward compatibility until fully switched.

Tool schema parity:
- OpenAI: `tools: [{ type: 'function', function: { name, description, parameters }}]`.
- Gemini: Use `functionDeclarations` with JSON schema; ensure identical parameter names: `zoraHandle`, `amountUSD`.

---
## 5. Zora Integration

File: `src/lib/zora.ts`.
- `lookupZoraProfile(identifier)` uses `@zoralabs/coins-sdk` `getProfile`.
- Returns normalized subset (`handle`, `displayName`, `creatorCoin.address`, etc.).
- Buying coin currently simulated, real flow replaced by CDP `smartAccount.swap` inside `/api/zora/buy`.

If expanding:
- Add price/quote retrieval + slippage pre-check before calling `swap`.
- Cache profile lookups (memory or edge cache) keyed by handle.
- Validate `amountUSD` boundaries server side (currently <=100; adjust via config constant).

---
## 6. API Route Conventions

All routes under `src/app/api/.../route.ts`:
- Early authentication guard (session cookie).
- Validate JSON body with explicit field presence; return 400 on missing.
- Log critical steps (creation, user op submission) with clear emojis/prefix for dev filtering.
- On failure: log full error, respond with generic error message (avoid leaking internals).

When adding a new API route using spend permission calls:
1. Auth guard.
2. Resolve server wallet & smart account (error if absent, instruct user to re-init permissions).
3. Validate user-provided `spendCalls` shape: array of `{ to: 0x..., data: 0x... }` only.
4. Execute via `cdpClient.evm.sendUserOperation` (sponsored).
5. Perform domain-specific logic (swap, transfer, etc.).
6. Return `success`, contextual message, and optional redirect object.

---
## 7. Environment Variables (Expected)

```
CDP_API_KEY_ID
CDP_API_KEY_SECRET
CDP_WALLET_SECRET
OPENAI_API_KEY        (remove if migrating exclusively to Gemini)
GEMINI_API_KEY        (future)
PAYMASTER_URL         (CDP paymaster endpoint)
ZORA_API_KEY          (optional but recommended)
SESSION_SECRET        (production JWT signing)
```

Copilot: Suggest `.env.example` alignment when adding new vars; avoid hardcoding addresses except canonical constants.

---
## 8. Data & State Handling

Frontend:
- `localStorage.spendPermission` single object; treat as authoritative until revoked.
- React state machines: boolean flags for loading, revoking; keep simple.

Server:
- In-memory Maps only for development; production must externalize (Redis / Postgres) for:
  - Session nonces
  - Server wallet associations
  - Audit log of executed spend calls

---
## 9. Error Handling & Logging Guidelines

Patterns to preserve:
- Use descriptive console logs with emojis for scanning (e.g., `🔧`, `✅`, `❌`).
- Convert thrown errors to generic user messages (avoid leaking stackframes) while retaining detailed server logs.
- Wrap critical async flows in try/catch blocks with early returns on validation errors.

Copilot: When generating new code, mirror existing emoji + prefix style and avoid introducing external logging libs unless requested.

---
## 10. Extending the Agent (Examples)

Add new tool (e.g., check creator coin stats):
1. Define tool schema in AI layer (OpenAI/Gemini) with JSON parameters.
2. On tool invocation, perform read-only action (e.g., fetch profile & return formatted summary) without spend calls.
3. Respond through `/api/chat` with `toolCall:false` if no transaction needed.

Add multi-action purchase (batch):
- Aggregate multiple `prepareSpendCallData` outputs then pass combined `calls` array to backend in one user operation (respect allowance and per-period limits).

Scheduled tasks (future):
- Avoid autonomous spend without explicit user prompt—retain principle of user intention per permission usage.

---
## 11. Security & Abuse Constraints

Baseline rules:
- Never escalate spend beyond user granted allowance.
- Do not auto-refresh or silently extend permissions.
- Enforce upper bound on single purchase amount (config constant, currently $100). Consider dynamic risk-based thresholds.
- Validate token addresses if expanding beyond USDC—whitelist approach recommended.
- Do not trust client-provided `amountUSD` alone; recompute or constrain on server.

---
## 12. Code Generation Prompts (Hints for Copilot)

Examples:
- "Create a new API route that consumes existing spend calls and performs an ERC20->ERC20 swap before transferring output to user. Follow `/api/zora/buy` retry + sponsorship pattern."
- "Add Gemini implementation in `src/lib/ai/gemini.ts` mirroring `generateChatResponse` interface."
- "Add function to list remaining daily spend using `getPermissionStatus` and render in header badge." 

---
## 13. Migration Checklist (OpenAI → Gemini)

[] Create `src/lib/ai/gemini.ts` with wrapper `generateChatResponse` returning same shape (choices[0].message.* shim).
[] Abstract current OpenAI usage behind `src/lib/ai/index.ts` export selecting provider by env var `AI_PROVIDER`.
[] Update `/api/chat` to consume abstraction only.
[] Add `GEMINI_API_KEY` to env & docs.
[] Parity test: ensure tool call JSON arguments identical.

---
## 14. Testing Strategy (Future)

Planned lightweight tests:
- Unit: permission filtering & USD->USDC conversion.
- Integration (mocked CDP): user op call shape generation.
- AI tool parsing: ensure `buy_zora_coin` arguments extracted correctly for both OpenAI & Gemini.

Copilot: When adding tests, place under `__tests__/` using Jest or Vitest (add dev deps) and mock network/SDK calls.

---
## 15. Style & Conventions

TypeScript:
- Use explicit return types in exported functions.
- Narrow `any` types (e.g., define `ServerWallet`, `SpendPermission` interfaces).
- Use `as \
`0x${string}` for addresses.

Formatting:
- Preserve existing logging style and minimal comments focusing on intent.

---
## 16. Quick Reference Snippets

Request spend permission (frontend):
```ts
const permission = await requestSpendPermission({
  account: userAddress as `0x${string}`,
  spender: smartAccount as `0x${string}`,
  token: USDC_BASE as `0x${string}`,
  chainId: 8453,
  allowance: BigInt(dailyLimitUSD * 1_000_000),
  periodInDays: 1,
  provider: createBaseAccountSDK({ appName }).getProvider(),
})
```

Prepare spend calls:
```ts
const status = await getPermissionStatus(permission)
if (status.remainingSpend < amountUSDC) throw new Error('Insufficient remaining spend')
const spendCalls = await prepareSpendCallData(permission, amountUSDC)
```

Execute user op (server):
```ts
await cdpClient.evm.sendUserOperation({
  smartAccount,
  network: 'base',
  calls: spendCalls.map(c => ({ to: c.to, data: c.data })),
  paymasterUrl: process.env.PAYMASTER_URL,
})
```

Swap via smart account:
```ts
const swap = await smartAccount.swap({
  network: 'base',
  fromToken: USDC,
  toToken: targetToken,
  fromAmount: amountUSDC,
  slippageBps: 500,
  paymasterUrl: process.env.PAYMASTER_URL,
})
```

---
## 17. Future Enhancements (Backlog Seeds)

- DB persistence for permission + execution audit trails.
- Multi-token & multi-period spend permissions UI.
- Rate limiting per user for tool-triggered purchases.
- Real price quoting & slippage simulation pre-swap.
- Realtime streaming responses (Server-Sent Events) for agent thinking.
- Error classification & user guidance (insufficient allowance, swap slippage, network congestion).

---
## 18. Golden Rules for Copilot

1. Never exceed user-granted spend allowance.
2. Keep AI provider abstraction thin & pluggable.
3. Reuse existing patterns for logging & retry logic.
4. Validate all external inputs before blockchain calls.
5. Maintain minimal, well-typed interfaces—no unchecked `any` sprawl.

---
End of instructions.

---
## 19. Gemini Adapter Example (Drop-In Replacement for OpenAI)

Create `src/lib/ai/gemini.ts`:
```ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Mirror OpenAI's interface surface expected by /api/chat
export async function generateChatResponse(messages: { role: 'user'|'assistant'|'system'; content: string }[], tools: any[]) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools: [{
      functionDeclarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      }))
    }],
    systemInstruction: messages.find(m => m.role === 'system')?.content,
  })

  const userFacing = messages.filter(m => m.role !== 'system')
  const result = await model.generateContent({
    contents: userFacing.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
  })

  // Shim to OpenAI-like shape
  const toolCall = result.response.functionCall()
  return {
    choices: [
      {
        message: {
          content: result.response.text() || '',
          tool_calls: toolCall ? [{ function: { name: toolCall.name, arguments: JSON.stringify(toolCall.args) } }] : undefined,
        }
      }
    ]
  }
}
```

Adapter index `src/lib/ai/index.ts`:
```ts
import { ZORA_BUY_FUNCTION } from '../openai' // reuse schema
const provider = process.env.AI_PROVIDER || 'openai'

export async function generateAgent(messages, tools = [ZORA_BUY_FUNCTION]) {
  if (provider === 'gemini') {
    const { generateChatResponse } = await import('./gemini')
    return generateChatResponse(messages, tools)
  } else {
    const { generateChatResponse } = await import('../openai')
    return generateChatResponse(messages, tools)
  }
}
```

Update `/api/chat` to import from `src/lib/ai/index.ts` not `openai.ts`.

---
## 20. Sign-In Flow End-to-End (Condensed Example)

Client:
```ts
const provider = createBaseAccountSDK({ appName: 'Your App' }).getProvider()
const { nonce } = await fetch('/api/auth/verify').then(r=>r.json())
await provider.request({ method: 'eth_requestAccounts' })
await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] })
const connect = await provider.request({ method: 'wallet_connect', params: [{ version: '1', capabilities: { signInWithEthereum: { chainId: '0x2105', nonce } } }] })
const { address } = connect.accounts[0]
const { message, signature } = connect.signInWithEthereum ?? await fallbackPersonalSign(provider, address, nonce)
await fetch('/api/auth/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ address, message, signature }) })
```

Server verify (core logic):
```ts
const isValid = await client.verifyMessage({ address, message, signature })
if(!isValid) return 401
response.cookies.set('session', Buffer.from(`${address}:${Date.now()}`).toString('base64'), { httpOnly:true, ... })
```

---
## 21. Spend Permission Round Trip (Full Flow)

```ts
// 1. Ensure smart account (spender)
const w = await fetch('/api/wallet/create', { method:'POST' }).then(r=>r.json())
const spender = w.smartAccountAddress

// 2. Request permission
const allowance = BigInt(dailyUSD * 1_000_000)
const permission = await requestSpendPermission({
  account: user as `0x${string}`,
  spender: spender as `0x${string}`,
  token: USDC as `0x${string}`,
  chainId: 8453,
  allowance,
  periodInDays: 1,
  provider: createBaseAccountSDK({ appName }).getProvider(),
})
localStorage.setItem('spendPermission', JSON.stringify(permission))

// 3. Execute spend later
const status = await getPermissionStatus(permission)
const required = BigInt(Math.floor(amountUSD * 1_000_000))
if (status.remainingSpend < required) throw new Error('Insufficient remaining')
const spendCalls = await prepareSpendCallData(permission, required)
// 4. Send to backend for on-chain execution + domain action
await fetch('/api/zora/buy', { method:'POST', body: JSON.stringify({ zoraHandle, amountUSD, spendCalls }), headers:{'Content-Type':'application/json'} })
```

Revocation:
```ts
await requestRevoke({ permission, provider: createBaseAccountSDK({ appName }).getProvider() })
```

---
## 22. Server Wallet & Smart Account Creation (Essentials)

```ts
export async function createServerWalletForUser(userAddress: string) {
  if (serverWallets.has(userAddress) && serverWallets.get(userAddress)?.smartAccount) return serverWallets.get(userAddress)!
  const cdp = getCdpClient()
  const account = await cdp.evm.createAccount()            // custodial EOA
  const smartAccount = await cdp.evm.createSmartAccount({ owner: account })
  serverWallets.set(userAddress, { address: account.address, walletClient: createWalletClient({ account: toAccount(account), chain: base, transport: http() }), account, smartAccount })
  return serverWallets.get(userAddress)!
}
```

Execution with sponsorship:
```ts
await cdpClient.evm.sendUserOperation({
  smartAccount: serverWallet.smartAccount,
  network: 'base',
  calls: spendCalls.map(c => ({ to: c.to, data: c.data })),
  paymasterUrl: process.env.PAYMASTER_URL,
})
```

---
## 23. Solimar App Multi-Agent Notes

If building a Solimar-style multi-agent orchestration layer:
- Introduce an agent registry: each agent declares capabilities (e.g., BUY_COIN, CHECK_BALANCE, REVOKE_PERMISSION).
- Permission gating: map each capability to required spend scope or read-only scope. Only BUY_COIN needs spend permission consumption.
- Shared AI abstraction: route natural language to intent classifier (Gemini function calling) producing structured intents consumed by specialized agent executors.
- Deterministic execution pipeline:
  1. Parse user request to intent JSON.
  2. Validate intent (amount caps, token whitelist).
  3. Acquire or refresh spend permission status.
  4. Prepare execution calls (idempotent step; hash calls for replay protection logging).
  5. Submit user operation; await completion; emit event.
  6. Persist audit trail (intent, permission hash, userOp hash, timestamp).
- Concurrency: lock per user during spend-consuming intents to avoid racing allowance consumption.
- Observability: add structured logs (JSON) behind a flag for multi-agent debugging.

Sample intent shape:
```ts
interface BuyCoinIntent {
  type: 'BUY_COIN'
  handle: string
  amountUSD: number
  user: `0x${string}`
  requestId: string
}
```

Dispatcher sketch:
```ts
async function dispatchIntent(intent: BuyCoinIntent) {
  const lock = await acquireUserLock(intent.user)
  try {
    const serverWallet = ensureServerWallet(intent.user)
    const permission = loadPermission(intent.user)
    const status = await getPermissionStatus(permission)
    const required = BigInt(Math.floor(intent.amountUSD * 1_000_000))
    if (status.remainingSpend < required) throw new Error('Allowance exhausted')
    const spendCalls = await prepareSpendCallData(permission, required)
    return executePurchase(serverWallet, spendCalls, intent)
  } finally { lock.release() }
}
```

---
## 24. Additional Test Skeletons

Permission math test (Vitest):
```ts
import { describe, it, expect } from 'vitest'
import { getPermissionStatus } from '@base-org/account/spend-permission'

describe('usd->usdc math', () => {
  it('converts correctly', () => {
    const usd = 1.25
    const usdc = BigInt(Math.floor(usd * 1_000_000))
    expect(usdc).toBe(1250000n)
  })
})
```

---
## 25. Rapid Checklist for New Feature PRs

- [ ] Auth guard added to new API endpoints
- [ ] Session decoding implemented once per handler
- [ ] Spend permission status validated before consumption
- [ ] USD->USDC uses integer math (floor then BigInt)
- [ ] Calls array sanitized to `{ to, data }` only
- [ ] Paymaster URL provided for every user operation / swap
- [ ] Logs use existing emoji + concise phrasing
- [ ] Added or updated environment variable docs (if needed)
- [ ] No leakage of raw stack traces in API responses

---
## 26. Minimal Fallbacks

If CDP smart account missing mid-session:
```ts
if(!serverWallet?.smartAccount){ return NextResponse.json({ error: 'Smart account missing; re-init spend permissions.' }, { status: 400 }) }
```

If spend permission not found client side:
```ts
const permissionJSON = localStorage.getItem('spendPermission')
if(!permissionJSON) throw new Error('Spend permission not set. Please configure it first.')
```

---
## 27. Quick Migration Flag

Set `AI_PROVIDER=gemini` in `.env.local` to switch once adapter added. Default remains OpenAI.

---
End of extended instructions.
