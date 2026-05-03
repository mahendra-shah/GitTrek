import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken, getToken } from '../../src/lib/auth/adapter';

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    COOKIE_SECRET: 'super-secret-test-key-that-is-at-least-32-chars-long',
  },
}));

// Mock next/headers
const mockGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockGet,
  })),
}));

describe('Auth Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs and verifies a token correctly', async () => {
    const rawToken = 'ghu_1234567890abcdef';
    
    // 1. Sign it
    const signedCookie = signToken(rawToken);
    expect(signedCookie).toContain('.'); // Should have a dot separating payload and sig

    // 2. Mock the cookie store to return this signed cookie
    mockGet.mockReturnValue({ value: signedCookie });

    // 3. Verify it returns the original token
    const result = await getToken();
    expect(result).toBe(rawToken);
  });

  it('returns null if token signature is tampered with', async () => {
    const rawToken = 'ghu_1234567890abcdef';
    const signedCookie = signToken(rawToken);
    
    // Tamper with signature
    const [payload] = signedCookie.split('.');
    const tamperedCookie = `${payload}.invalid_signature_that_does_not_match`;

    mockGet.mockReturnValue({ value: tamperedCookie });

    const result = await getToken();
    expect(result).toBeNull();
  });

  it('returns null if payload is tampered with', async () => {
    const rawToken = 'ghu_1234567890abcdef';
    const signedCookie = signToken(rawToken);
    
    // Tamper with payload
    const [payload, sig] = signedCookie.split('.');
    const tamperedCookie = `${payload}X.${sig}`;

    mockGet.mockReturnValue({ value: tamperedCookie });

    const result = await getToken();
    expect(result).toBeNull();
  });

  it('returns null if no cookie is found', async () => {
    mockGet.mockReturnValue(undefined);

    const result = await getToken();
    expect(result).toBeNull();
  });
});
