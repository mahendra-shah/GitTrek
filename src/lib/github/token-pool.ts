/**
 * GitTrek Token Pool Utility
 * 
 * Manages multiple GitHub Personal Access Tokens (PATs) with exhaustion-aware rotation.
 * This triples (or more) the guest search capacity while ensuring we respect
 * GitHub's rate limit headers per-token.
 */

// Note: In a serverless environment, instance variables persist only as long as the instance is warm.
// For launch, this is highly effective. Post-launch consider moving to Redis/KV.

export interface TokenPoolOptions {
  tokens: string[];
}

export class TokenPool {
  private tokens: string[];
  private exhaustion: Map<string, number> = new Map();

  constructor(options: TokenPoolOptions) {
    this.tokens = options.tokens.filter(Boolean);
  }

  /**
   * Returns the first available token that isn't currently exhausted.
   */
  public selectToken(): string | null {
    const now = Date.now();
    for (const tok of this.tokens) {
      const until = this.exhaustion.get(tok) ?? 0;
      if (until <= now) return tok;
    }
    return null;
  }

  /**
   * Returns all tokens that are currently available.
   */
  public getAvailableTokens(): string[] {
    const now = Date.now();
    return this.tokens.filter((tok) => (this.exhaustion.get(tok) ?? 0) <= now);
  }

  /**
   * Marks a token as exhausted until the specified reset time.
   * @param token The token string
   * @param resetAtSec The Unix timestamp (seconds) when the limit resets
   */
  public exhaustToken(token: string, resetAtSec?: number | null): void {
    const until = resetAtSec ? resetAtSec * 1000 : Date.now() + 60_000;
    this.exhaustion.set(token, until);
    
    // Log for monitoring (Vercel logs)
    const masked = `...${token.slice(-6)}`;
    console.warn(`[TokenPool] Token ${masked} exhausted until ${new Date(until).toISOString()}`);
  }

  /**
   * Clears all exhaustion states (useful for testing).
   */
  public clear(): void {
    this.exhaustion.clear();
  }

  /**
   * Utility to check if any tokens are left.
   */
  public hasCapacity(): boolean {
    return this.selectToken() !== null;
  }
}


// Global instance initialized with env var
export const botTokenPool = new TokenPool({
  tokens: (process.env.GITHUB_BOT_TOKEN ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
});
