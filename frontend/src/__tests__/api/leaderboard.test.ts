import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '../setup';
import { MOCK_LEADERBOARD } from '../mocks/handlers';

describe('Leaderboard API', () => {
  describe('GET /api/leaderboard', () => {
    it('returns leaderboard data', async () => {
      const response = await fetch('/api/leaderboard');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
    });

    it('returns correct leaderboard structure', async () => {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('leaderboard');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('updatedAt');
    });

    it('supports category parameter', async () => {
      const response = await fetch('/api/leaderboard?category=social');
      const data = await response.json();
      expect(data.category).toBe('social');
    });

    it('supports limit parameter', async () => {
      const response = await fetch('/api/leaderboard?limit=10');
      expect(response.ok).toBe(true);
    });

    // CRITICAL: No PII tests
    describe('PII Protection', () => {
      it('does NOT return email addresses', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          expect(entry).not.toHaveProperty('email');
        });
      });

      it('does NOT return twitter handles', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          expect(entry).not.toHaveProperty('twitter');
        });
      });

      it('does NOT return discord usernames', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          expect(entry).not.toHaveProperty('discord');
        });
      });

      it('does NOT return github handles', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          expect(entry).not.toHaveProperty('github');
        });
      });

      it('does NOT return telegram handles', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          expect(entry).not.toHaveProperty('telegram');
        });
      });

      it('only returns boolean social presence indicators', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          // Should have boolean indicators, not actual values
          if ('hasTwitter' in entry) {
            expect(typeof entry.hasTwitter).toBe('boolean');
          }
          if ('hasDiscord' in entry) {
            expect(typeof entry.hasDiscord).toBe('boolean');
          }
          if ('hasGithub' in entry) {
            expect(typeof entry.hasGithub).toBe('boolean');
          }
        });
      });

      it('returns only safe public data', async () => {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        const allowedFields = [
          'rank',
          'userId',
          'username',
          'profilePic',
          'value',
          'valueLabel',
          'badges',
          'hasMinted',
          'hasTwitter',
          'hasDiscord',
          'hasGithub',
        ];

        data.leaderboard.forEach((entry: Record<string, unknown>) => {
          Object.keys(entry).forEach((key) => {
            expect(allowedFields).toContain(key);
          });
        });
      });
    });
  });
});
