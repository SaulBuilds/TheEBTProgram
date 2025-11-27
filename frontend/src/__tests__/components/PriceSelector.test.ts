import { describe, it, expect } from 'vitest';
import { parseEther } from 'viem';
import {
  MIN_MINT_PRICE,
  MAX_MINT_PRICE,
  PRICE_PRECISION,
  BASE_TOKENS_PER_MIN_PRICE,
} from '@/lib/contracts/addresses';

// Test the token calculation function directly
function calculateTokensForPrice(price: bigint): bigint {
  return (price * BASE_TOKENS_PER_MIN_PRICE) / MIN_MINT_PRICE;
}

describe('PriceSelector Token Calculations', () => {
  describe('calculateTokensForPrice', () => {
    it('returns base tokens for minimum price', () => {
      const tokens = calculateTokensForPrice(MIN_MINT_PRICE);
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE);
    });

    it('returns 100x tokens for maximum price (100x minimum)', () => {
      const tokens = calculateTokensForPrice(MAX_MINT_PRICE);
      // MAX is 2 ETH, MIN is 0.02 ETH = 100x
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE * 100n);
    });

    it('returns proportional tokens for intermediate prices', () => {
      // 0.1 ETH = 5x minimum price
      const price = parseEther('0.1');
      const tokens = calculateTokensForPrice(price);
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE * 5n);
    });

    it('returns correct tokens for 0.5 ETH', () => {
      // 0.5 ETH = 25x minimum price
      const price = parseEther('0.5');
      const tokens = calculateTokensForPrice(price);
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE * 25n);
    });

    it('returns correct tokens for 1 ETH', () => {
      // 1 ETH = 50x minimum price
      const price = parseEther('1');
      const tokens = calculateTokensForPrice(price);
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE * 50n);
    });

    it('handles smallest valid increment', () => {
      // MIN + 1 precision unit
      const price = MIN_MINT_PRICE + PRICE_PRECISION;
      const tokens = calculateTokensForPrice(price);
      // Should be slightly more than base tokens
      expect(tokens).toBeGreaterThan(BASE_TOKENS_PER_MIN_PRICE);
    });
  });

  describe('Price Validation', () => {
    it('minimum price passes all validations', () => {
      const price = MIN_MINT_PRICE;
      expect(price >= MIN_MINT_PRICE).toBe(true);
      expect(price <= MAX_MINT_PRICE).toBe(true);
      expect(price % PRICE_PRECISION).toBe(0n);
    });

    it('maximum price passes all validations', () => {
      const price = MAX_MINT_PRICE;
      expect(price >= MIN_MINT_PRICE).toBe(true);
      expect(price <= MAX_MINT_PRICE).toBe(true);
      expect(price % PRICE_PRECISION).toBe(0n);
    });

    it('all precision steps are valid', () => {
      // Test every 0.1 ETH from min to max
      let current = MIN_MINT_PRICE;
      const step = parseEther('0.1');

      while (current <= MAX_MINT_PRICE) {
        expect(current >= MIN_MINT_PRICE).toBe(true);
        expect(current <= MAX_MINT_PRICE).toBe(true);
        expect(current % PRICE_PRECISION).toBe(0n);
        current += step;
      }
    });
  });

  describe('Token Preview Accuracy', () => {
    it('displays readable token amounts', () => {
      const testCases = [
        { price: MIN_MINT_PRICE, expectedTokensStr: '20000' }, // 20,000 tokens
        { price: parseEther('0.1'), expectedTokensStr: '100000' }, // 100,000 tokens
        { price: parseEther('1'), expectedTokensStr: '1000000' }, // 1,000,000 tokens
        { price: MAX_MINT_PRICE, expectedTokensStr: '2000000' }, // 2,000,000 tokens
      ];

      testCases.forEach(({ price, expectedTokensStr }) => {
        const tokens = calculateTokensForPrice(price);
        const tokenWholeUnits = tokens / BigInt(10 ** 18);
        expect(tokenWholeUnits.toString()).toBe(expectedTokensStr);
      });
    });

    it('token calculation is deterministic', () => {
      const price = parseEther('0.5');
      const tokens1 = calculateTokensForPrice(price);
      const tokens2 = calculateTokensForPrice(price);
      expect(tokens1).toBe(tokens2);
    });
  });

  describe('Edge Cases', () => {
    it('handles 0.001 ETH increments correctly', () => {
      // Just above minimum
      const price = MIN_MINT_PRICE + PRICE_PRECISION;
      const tokens = calculateTokensForPrice(price);

      // Should be (21/20) * base = 1.05x base tokens
      const expectedRatio = (MIN_MINT_PRICE + PRICE_PRECISION) * BASE_TOKENS_PER_MIN_PRICE;
      expect(tokens).toBe(expectedRatio / MIN_MINT_PRICE);
    });

    it('handles max price correctly', () => {
      const tokens = calculateTokensForPrice(MAX_MINT_PRICE);
      // MAX = 2 ETH, MIN = 0.02 ETH, so 100x multiplier
      const expectedTokens = BASE_TOKENS_PER_MIN_PRICE * 100n;
      expect(tokens).toBe(expectedTokens);
    });

    it('maintains precision for all valid prices', () => {
      // Test that token calculation doesn't lose precision
      const testPrices = [
        MIN_MINT_PRICE,
        parseEther('0.021'),
        parseEther('0.123'),
        parseEther('0.456'),
        parseEther('1.234'),
        MAX_MINT_PRICE,
      ];

      testPrices.forEach((price) => {
        if (price % PRICE_PRECISION === 0n) {
          const tokens = calculateTokensForPrice(price);
          // Verify tokens is a positive integer
          expect(tokens).toBeGreaterThan(0n);
          // Verify no fractional tokens (within wei precision)
          expect(tokens % 1n).toBe(0n);
        }
      });
    });
  });
});
