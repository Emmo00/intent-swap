# IntentSwap 🌀

Swap tokens on Base with natural language.
Powered by **Google Gemini AI**, **0x API**, and **RainbowKit**.

---

## 🚀 What is IntentSwap?

IntentSwap is an **AI-driven swap agent** that lets you type what you want in plain English —
like *"swap 0.2 WETH for USDC"* — and have it executed onchain.

* Chat with the AI agent to specify your swap.
* **You sign every transaction** directly in your wallet (no delegations).
* Swaps execute through **0x Permit2** for best prices & MEV protection.
* See **live step-by-step feedback** as your swap progresses.
* Track complete **swap history** with BaseScan links.

---

## 🖼️ App Flow

1. **Landing Page** → Bold neo-brutalist UI with a call-to-action to *Start Swapping*.
2. **Connect Wallet** → RainbowKit modal for any Base-compatible wallet.
3. **Chat UI** → Type swap intents in plain language to the AI agent.
4. **AI Parsing** → Gemini AI converts text into structured swap parameters.
5. **Price Quote** → App fetches live pricing from 0x API and shows you the details.
6. **Confirm & Execute** → You sign:
   - **Approve Permit2** (if first time swapping a token)
   - **Permit2 EIP-712 signature** (authorizing the swap router)
   - **Swap transaction** (executes on Base)
7. **Live Status** → Watch each step execute in real-time in the chat.
8. **History Sidebar** → All your completed swaps with amounts, tx hashes, and explorer links.

---

## 🔑 Features

* **Natural language swap intents** → AI understands "swap 5 USDC for DEGEN".
* **You control every transaction** → no delegated permissions, you sign each step.
* **Live step tracking** → see approvals, signatures, and confirmations in real-time.
* **Full transparency** → transaction history with BaseScan links.
* **Base-only** → optimized for Base network with low fees.
* **Neo-brutalist UI** → chat-based interface with bold design.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 16, React 19, TailwindCSS
* **Wallet:** RainbowKit 2.2, wagmi 2.18, viem 2.38
* **AI:** Google Gemini 2.5 Flash for intent parsing
* **Swaps:** 0x API (Permit2 endpoints)
* **Database:** MongoDB (chat sessions, swap history)
* **Chain:** Base Mainnet only

## 📜 Architecture Overview

```text
User → Connect wallet (RainbowKit)
User → Chat swap intent → Gemini AI parses
Frontend → Fetch quote from 0x API
Frontend → User approves Permit2 (if needed) → tx on Base
Frontend → User signs Permit2 EIP-712 message
Frontend → User signs & sends swap tx → executed on Base via 0x router
Frontend → Waits for confirmation → saves to history → shows success
```

---

## 🔒 Security Notes

* **You sign every transaction** — no server-side custody or delegations.
* **Permit2 is a standard** — widely used across DeFi for secure token approvals.
* **Gas required** — you need some ETH on Base to pay for transactions.
* **Transaction history is private** — only you can see your swap record.

---

## 📄 License

MIT License.
