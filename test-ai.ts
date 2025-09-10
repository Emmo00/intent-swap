import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Please set the GEMINI_API_KEY environment variable");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-exp",
      contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
