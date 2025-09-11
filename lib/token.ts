import { setOnchainKitConfig } from "@coinbase/onchainkit";
import { getTokens } from "@coinbase/onchainkit/api";

setOnchainKitConfig({ apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY! });

export async function getTokenContractByNameOrSymbol(name: string) {
  const tokens = await getTokens({ limit: "1", search: name });

  return Array.isArray(tokens) && tokens.length > 0 ? tokens[0] : null;
}
