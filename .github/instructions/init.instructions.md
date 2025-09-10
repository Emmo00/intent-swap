---
applyTo: '**'
---

> I am building an app called **IntentSwap**. The goal is to let users perform token swaps on Base using **natural language** and **SpendPermissions**.
>
> **How it works:**
>
> * The user types a natural language request like *“swap 0.2 ETH for USDC”*.
> * An LLM parses this into structured parameters (`sellToken`, `buyToken`, `amount`).
> * The user grants a **SpendPermission** (EIP-712 signature) to a CDP server wallet.
> * The server wallet uses this permission to submit a swap transaction through **CoW Protocol settlement contracts**.
> * After execution, the result tokens are returned to the user’s wallet.
> * The UI should also display a sidebar of **active swaps** linked to spend permissions, and show receipts (transaction hashes, token amounts, status).
>
> **Important instructions for you (Copilot):**
>
> * Do **not** make edits to the theme, layout, or styling. The app already uses a **neo-brutalist style** with Tailwind/React.
> * Do **not** change the existing UI or design system.
> * Your task is only to **integrate data and write functionality**: connect the chat input, LLM parsing, SpendPermissions signing, server calls, and transaction receipts.
> * Just understand this context now. Do not attempt to edit code yet.
