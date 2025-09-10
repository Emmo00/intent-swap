import { generateChatResponse } from "./lib/ai";
import type { ChatMessage } from "./types";
import "dotenv/config";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function printResponse(response: any) {
  console.log("\n" + "=".repeat(50));
  console.log("🤖 AI Response:");

  if (response.candidates) {
    response.candidates.forEach((candidate: any, index: number) => {
      console.log(`\nCandidate ${index + 1}:`);

      // Print content
      if (candidate.content?.parts) {
        candidate.content.parts.forEach((part: any, partIndex: number) => {
          if (part.text) {
            console.log(`📝 Content: ${part.text}`);
          }
          if (part.functionCall) {
            console.log(`🔧 Function Call:`);
            console.log(`   Name: ${part.functionCall.name}`);
            console.log(`   Arguments:`, JSON.stringify(part.functionCall.args, null, 2));
          }
        });
      }

      // Print function calls (alternative structure)
      if (candidate.functionCalls) {
        console.log(`🔧 Function Calls:`);
        candidate.functionCalls.forEach((call: any) => {
          console.log(`   Name: ${call.name}`);
          console.log(`   Arguments:`, JSON.stringify(call.args, null, 2));
        });
      }
    });
  }

  console.log("=".repeat(50) + "\n");
}

async function interactiveSession() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Please set the GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  console.log("🚀 Starting Interactive AI Session for IntentSwap");
  console.log("Type 'exit' to quit, 'clear' to reset conversation\n");

  const messages: ChatMessage[] = [];

  while (true) {
    try {
      const userInput = await promptUser("💬 You: ");

      if (userInput.toLowerCase() === "exit") {
        console.log("👋 Goodbye!");
        break;
      }

      if (userInput.toLowerCase() === "clear") {
        messages.length = 0;
        console.log("🧹 Conversation cleared!\n");
        continue;
      }

      // add model message if message starts with "model:"
      if (userInput.toLowerCase().startsWith("model:")) {
        const modelMessage = userInput.slice(6).trim();
        messages.push({ role: "model", content: modelMessage });
      } else {
        // Add user message
        messages.push({ role: "user", content: userInput });
      }

      console.log("\n🤔 AI is thinking...");

      // Get AI response
      const response = await generateChatResponse(messages);

      // Print the response details
      printResponse(response);

      // Add assistant response to conversation history
      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        messages.push({
          role: "model",
          content: response.candidates[0].content.parts[0].text,
        });
      }
    } catch (error) {
      console.error("❌ Error:", error);
      console.log("Please try again.\n");
    }
  }

  rl.close();
}

interactiveSession();
