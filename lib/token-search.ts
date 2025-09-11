'use client';

import { getTokens } from '@coinbase/onchainkit/api';

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  image?: string;
  chainId: number;
}

/**
 * Client-side token lookup using OnchainKit
 * This function can only be called from client components
 */
export async function searchTokenByNameOrSymbol(searchTerm: string): Promise<TokenInfo | null> {
  try {
    console.log(`🔍 Searching for token: ${searchTerm}`);
    
    const tokens = await getTokens({ 
      limit: '1', 
      search: searchTerm 
    });

    if (Array.isArray(tokens) && tokens.length > 0) {
      const token = tokens[0];
      console.log(`✅ Found token:`, token);
      
      return {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        image: token.image || undefined,
        chainId: token.chainId,
      };
    }

    console.log(`❌ No token found for: ${searchTerm}`);
    return null;
  } catch (error) {
    console.error(`Error searching for token ${searchTerm}:`, error);
    return null;
  }
}

/**
 * Get multiple tokens by search terms
 */
export async function searchTokens(searchTerm: string, limit: string = '10'): Promise<TokenInfo[]> {
  try {
    const tokens = await getTokens({ 
      limit, 
      search: searchTerm 
    });

    if (Array.isArray(tokens)) {
      return tokens.map(token => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        image: token.image || undefined,
        chainId: token.chainId,
      }));
    }

    return [];
  } catch (error) {
    console.error(`Error searching for tokens with ${searchTerm}:`, error);
    return [];
  }
}
