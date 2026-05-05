import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenPool } from '@/lib/github/token-pool';

describe('TokenPool', () => {
  const mockTokens = ['token1', 'token2', 'token3'];
  let pool: TokenPool;

  beforeEach(() => {
    pool = new TokenPool({ tokens: mockTokens });
    pool.clear();
    vi.useFakeTimers();
  });

  it('selects the first available token initially', () => {
    expect(pool.selectToken()).toBe('token1');
  });

  it('skips exhausted tokens', () => {
    const now = Date.now();
    // Exhaust token1 for 1 minute
    pool.exhaustToken('token1', (now + 60000) / 1000);
    
    expect(pool.selectToken()).toBe('token2');
  });

  it('returns null when all tokens are exhausted', () => {
    const now = Date.now();
    pool.exhaustToken('token1', (now + 60000) / 1000);
    pool.exhaustToken('token2', (now + 60000) / 1000);
    pool.exhaustToken('token3', (now + 60000) / 1000);
    
    expect(pool.selectToken()).toBeNull();
    expect(pool.hasCapacity()).toBe(false);
  });

  it('recovers token after reset time passes', () => {
    const now = Date.now();
    pool.exhaustToken('token1', (now + 60000) / 1000);
    expect(pool.selectToken()).toBe('token2');

    // Advance time by 61 seconds
    vi.advanceTimersByTime(61000);
    
    expect(pool.selectToken()).toBe('token1');
  });

  it('handles resetAt in the past', () => {
    const now = Date.now();
    // Reset time is 10 seconds ago
    pool.exhaustToken('token1', (now - 10000) / 1000);
    
    expect(pool.selectToken()).toBe('token1');
  });

  it('getAvailableTokens returns only non-exhausted tokens', () => {
    const now = Date.now();
    pool.exhaustToken('token2', (now + 60000) / 1000);
    
    const available = pool.getAvailableTokens();
    expect(available).toContain('token1');
    expect(available).toContain('token3');
    expect(available).not.toContain('token2');
  });
});
