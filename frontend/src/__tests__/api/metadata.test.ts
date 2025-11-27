import { describe, it, expect } from 'vitest';

describe('Metadata API', () => {
  describe('GET /api/metadata/:tokenId', () => {
    it('returns metadata for valid tokenId', async () => {
      const response = await fetch('/api/metadata/1');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.tokenId).toBe(1);
      expect(data.metadata).toBeDefined();
    });

    it('returns correct metadata structure', async () => {
      const response = await fetch('/api/metadata/1');
      const data = await response.json();

      expect(data).toHaveProperty('tokenId');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('metadataURI');
      expect(data).toHaveProperty('metadata');
      expect(data).toHaveProperty('accountAddress');
    });

    it('returns NFT standard metadata', async () => {
      const response = await fetch('/api/metadata/1');
      const data = await response.json();

      expect(data.metadata).toHaveProperty('name');
      expect(data.metadata).toHaveProperty('description');
      expect(data.metadata).toHaveProperty('image');
      expect(data.metadata).toHaveProperty('attributes');
    });

    describe('Error Handling', () => {
      it('returns 400 for invalid tokenId (non-numeric)', async () => {
        const response = await fetch('/api/metadata/abc');
        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Invalid tokenId');
      });

      it('returns 400 for negative tokenId', async () => {
        const response = await fetch('/api/metadata/-1');
        expect(response.status).toBe(400);
      });

      it('returns 400 for decimal tokenId', async () => {
        const response = await fetch('/api/metadata/1.5');
        expect(response.status).toBe(400);
      });

      it('returns 404 for non-existent tokenId', async () => {
        const response = await fetch('/api/metadata/999');
        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data.error).toBe('Not found');
      });
    });

    describe('Edge Cases', () => {
      it('handles tokenId 0', async () => {
        const response = await fetch('/api/metadata/0');
        // Should be valid - tokenId 0 is a valid NFT ID
        expect([200, 404]).toContain(response.status);
      });

      it('handles large tokenId', async () => {
        const response = await fetch('/api/metadata/9999999');
        // Should not crash, just return 404
        expect([200, 404]).toContain(response.status);
      });

      it('handles tokenId with leading zeros', async () => {
        const response = await fetch('/api/metadata/001');
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.tokenId).toBe(1); // Should be normalized
      });
    });

    describe('XSS Prevention', () => {
      it('sanitizes metadata content', async () => {
        const response = await fetch('/api/metadata/1');
        const data = await response.json();

        // Check that no script tags in metadata
        const metadataStr = JSON.stringify(data.metadata);
        expect(metadataStr).not.toContain('<script');
        expect(metadataStr).not.toContain('javascript:');
        expect(metadataStr).not.toContain('onerror=');
        expect(metadataStr).not.toContain('onclick=');
      });
    });
  });
});
