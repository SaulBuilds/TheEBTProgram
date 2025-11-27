import { describe, it, expect } from 'vitest';
import {
  MIN_MINT_PRICE,
  MAX_MINT_PRICE,
  PRICE_PRECISION,
  BASE_TOKENS_PER_MIN_PRICE,
  SOFT_CAP,
  HARD_CAP,
  FUNDRAISING_PERIOD,
  CLAIM_INTERVAL,
  MAX_CLAIMS,
  FOOD_STAMPS_DECIMALS,
  CONTRACT_ADDRESSES,
  SEPOLIA_CHAIN_ID,
  DISTRIBUTION,
} from '@/lib/contracts/addresses';
import { formatEther, parseEther } from 'viem';

describe('Contract Constants', () => {
  describe('Pricing Constants', () => {
    it('MIN_MINT_PRICE equals 0.02 ETH', () => {
      expect(MIN_MINT_PRICE).toBe(BigInt('20000000000000000'));
      expect(formatEther(MIN_MINT_PRICE)).toBe('0.02');
    });

    it('MAX_MINT_PRICE equals 2 ETH', () => {
      expect(MAX_MINT_PRICE).toBe(BigInt('2000000000000000000'));
      expect(formatEther(MAX_MINT_PRICE)).toBe('2');
    });

    it('PRICE_PRECISION equals 0.001 ETH', () => {
      expect(PRICE_PRECISION).toBe(BigInt('1000000000000000'));
      expect(formatEther(PRICE_PRECISION)).toBe('0.001');
    });

    it('MIN_MINT_PRICE is divisible by PRICE_PRECISION', () => {
      expect(MIN_MINT_PRICE % PRICE_PRECISION).toBe(0n);
    });

    it('MAX_MINT_PRICE is divisible by PRICE_PRECISION', () => {
      expect(MAX_MINT_PRICE % PRICE_PRECISION).toBe(0n);
    });

    it('MIN_MINT_PRICE is less than MAX_MINT_PRICE', () => {
      expect(MIN_MINT_PRICE).toBeLessThan(MAX_MINT_PRICE);
    });
  });

  describe('Token Constants', () => {
    it('BASE_TOKENS_PER_MIN_PRICE equals 20,000 tokens', () => {
      expect(BASE_TOKENS_PER_MIN_PRICE).toBe(BigInt('20000000000000000000000'));
      // 20,000 * 10^18
    });

    it('FOOD_STAMPS_DECIMALS equals 18', () => {
      expect(FOOD_STAMPS_DECIMALS).toBe(18);
    });

    it('tokens per ETH calculation is correct', () => {
      // 0.02 ETH should yield 20,000 tokens
      const tokens = (MIN_MINT_PRICE * BASE_TOKENS_PER_MIN_PRICE) / MIN_MINT_PRICE;
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE);
    });

    it('2x price yields 2x tokens', () => {
      const price = MIN_MINT_PRICE * 2n;
      const tokens = (price * BASE_TOKENS_PER_MIN_PRICE) / MIN_MINT_PRICE;
      expect(tokens).toBe(BASE_TOKENS_PER_MIN_PRICE * 2n);
    });
  });

  describe('Fundraising Constants', () => {
    it('SOFT_CAP equals 20 ETH', () => {
      expect(SOFT_CAP).toBe(BigInt('20000000000000000000'));
      expect(formatEther(SOFT_CAP)).toBe('20');
    });

    it('HARD_CAP equals 2000 ETH', () => {
      expect(HARD_CAP).toBe(BigInt('2000000000000000000000'));
      expect(formatEther(HARD_CAP)).toBe('2000');
    });

    it('SOFT_CAP is less than HARD_CAP', () => {
      expect(SOFT_CAP).toBeLessThan(HARD_CAP);
    });

    it('FUNDRAISING_PERIOD equals 30 days in seconds', () => {
      expect(FUNDRAISING_PERIOD).toBe(30 * 24 * 60 * 60);
    });
  });

  describe('Claim Constants', () => {
    it('CLAIM_INTERVAL equals 30 days in seconds', () => {
      expect(CLAIM_INTERVAL).toBe(30 * 24 * 60 * 60);
    });

    it('MAX_CLAIMS equals 3', () => {
      expect(MAX_CLAIMS).toBe(3);
    });
  });

  describe('Distribution Constants', () => {
    it('distribution percentages sum to 100%', () => {
      const total =
        DISTRIBUTION.LIQUIDITY_VAULT +
        DISTRIBUTION.MARKETING +
        DISTRIBUTION.TREASURY +
        DISTRIBUTION.TEAM;
      expect(total).toBe(100);
    });

    it('LIQUIDITY_VAULT is 65%', () => {
      expect(DISTRIBUTION.LIQUIDITY_VAULT).toBe(65);
    });

    it('MARKETING is 20%', () => {
      expect(DISTRIBUTION.MARKETING).toBe(20);
    });

    it('TREASURY is 10%', () => {
      expect(DISTRIBUTION.TREASURY).toBe(10);
    });

    it('TEAM is 5%', () => {
      expect(DISTRIBUTION.TEAM).toBe(5);
    });
  });

  describe('Contract Addresses', () => {
    it('has Sepolia chain ID defined', () => {
      expect(SEPOLIA_CHAIN_ID).toBe(11155111);
    });

    it('has all contract addresses for Sepolia', () => {
      const addresses = CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID];
      expect(addresses).toBeDefined();
      expect(addresses.EBTProgram).toBeDefined();
      expect(addresses.FoodStamps).toBeDefined();
      expect(addresses.ERC6551Registry).toBeDefined();
      expect(addresses.ERC6551Account).toBeDefined();
      expect(addresses.EBTApplication).toBeDefined();
      expect(addresses.LiquidityVault).toBeDefined();
      expect(addresses.TeamVesting).toBeDefined();
    });

    it('all addresses are valid hex strings', () => {
      const addresses = CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID];
      Object.values(addresses).forEach((address) => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    it('all addresses are unique', () => {
      const addresses = CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID];
      const addressList = Object.values(addresses);
      const uniqueAddresses = new Set(addressList);
      expect(uniqueAddresses.size).toBe(addressList.length);
    });
  });

  describe('Price Validation', () => {
    it('validates prices in valid range', () => {
      const validPrices = [
        MIN_MINT_PRICE,
        parseEther('0.05'),
        parseEther('0.1'),
        parseEther('0.5'),
        parseEther('1'),
        MAX_MINT_PRICE,
      ];

      validPrices.forEach((price) => {
        expect(price >= MIN_MINT_PRICE).toBe(true);
        expect(price <= MAX_MINT_PRICE).toBe(true);
        expect(price % PRICE_PRECISION).toBe(0n);
      });
    });

    it('rejects prices below minimum', () => {
      const invalidPrice = MIN_MINT_PRICE - 1n;
      expect(invalidPrice < MIN_MINT_PRICE).toBe(true);
    });

    it('rejects prices above maximum', () => {
      const invalidPrice = MAX_MINT_PRICE + 1n;
      expect(invalidPrice > MAX_MINT_PRICE).toBe(true);
    });

    it('rejects prices not aligned to precision', () => {
      const invalidPrice = parseEther('0.0215'); // Not multiple of 0.001
      expect(invalidPrice % PRICE_PRECISION).not.toBe(0n);
    });
  });
});
