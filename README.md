# IntentSwap 🌀

Swap tokens on Base with natural language.
Powered by **SpendPermissions** (Base Account SDK), **CDP Server Wallets**, and **CoW Protocol**.

---

## 🚀 What is IntentSwap?

IntentSwap is an **AI-driven swap agent** that lets you type what you want in plain English —
like *“swap 0.2 ETH for USDC”* — and have it executed onchain.

* Users **grant SpendPermissions** once to a server wallet.
* The server wallet uses this delegated permission to execute swaps on your behalf.
* Swaps are executed atomically through **CoW Protocol Settlement Contracts**.
* You always retain custody: funds never leave your wallet except when the swap is executed.

---

## 🖼️ App Flow

1. **Landing Page** → Bold neo-brutalist UI with a call-to-action to *Start Swapping*.
2. **Chat UI** → Type intents in plain language.
3. **AI Parsing** → LLM converts text into structured swap parameters.
4. **Permission Grant** → App asks you to sign a SpendPermission (EIP-712).
5. **Execution** → CDP server wallet submits the swap to CoW on your behalf.
6. **Receipts & Active Swaps** → Sidebar shows swaps you’ve authorized, with status and links to Basescan.

---

## 🔑 Features

* Natural language → structured swap intents.
* **SpendPermissions** to securely delegate swap execution.
* **CDP server wallet** pays gas, executes transactions.
* **Receipts view** with transaction hashes and status.
* Neo-brutalist UI design with chat-based swapping.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js, React, TailwindCSS
* **Backend:** Node.js (Express)
* **AI:** OpenAI (or any LLM) for intent parsing
* **Onchain:** Base Account SDK, CoW Protocol Settlement
* **Wallets:** CDP Server Wallets

## 📜 Architecture Overview

```text
User → Sign SpendPermission → Server
User → Type swap intent → AI parses
Server → Validate permission + intent
Server → Submit CoW swap via CDP wallet
CoW Settlement → Executes trade → Returns tokens to user
Server → Logs tx → Frontend shows receipt
```

---

## 🔒 Security Notes

* SpendPermissions are **revocable** — user can revoke anytime.
* Funds stay in the user’s account until execution.
* Server wallet never directly holds user funds.

---

## 📄 License

MIT License.
