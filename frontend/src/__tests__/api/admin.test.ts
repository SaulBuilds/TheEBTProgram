import { describe, it, expect } from 'vitest';

describe('Admin API Security', () => {
  const VALID_ADMIN_TOKEN = 'test-admin-token';
  const INVALID_ADMIN_TOKEN = 'invalid-token';

  describe('GET /api/admin/applications/pending', () => {
    it('returns 403 without admin token', async () => {
      const response = await fetch('/api/admin/applications/pending');
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('returns 403 with invalid admin token', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': INVALID_ADMIN_TOKEN,
        },
      });
      expect(response.status).toBe(403);
    });

    it('returns 200 with valid admin token', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': VALID_ADMIN_TOKEN,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.applications).toBeDefined();
      expect(Array.isArray(data.applications)).toBe(true);
    });
  });

  describe('POST /api/admin/applications/approve', () => {
    it('returns 403 without admin token', async () => {
      const response = await fetch('/api/admin/applications/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId: 1 }),
      });
      expect(response.status).toBe(403);
    });

    it('returns 403 with invalid admin token', async () => {
      const response = await fetch('/api/admin/applications/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': INVALID_ADMIN_TOKEN,
        },
        body: JSON.stringify({ applicationId: 1 }),
      });
      expect(response.status).toBe(403);
    });

    it('approves application with valid admin token', async () => {
      const response = await fetch('/api/admin/applications/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': VALID_ADMIN_TOKEN,
        },
        body: JSON.stringify({ applicationId: 1 }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.application).toBeDefined();
      expect(data.application.status).toBe('approved');
    });
  });

  describe('POST /api/admin/applications/reject', () => {
    it('returns 403 without admin token', async () => {
      const response = await fetch('/api/admin/applications/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationId: 1 }),
      });
      expect(response.status).toBe(403);
    });

    it('rejects application with valid admin token', async () => {
      const response = await fetch('/api/admin/applications/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': VALID_ADMIN_TOKEN,
        },
        body: JSON.stringify({ applicationId: 1, reason: 'Test rejection' }),
      });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.application).toBeDefined();
      expect(data.application.status).toBe('rejected');
    });
  });

  describe('Admin Token Security', () => {
    it('rejects empty admin token', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': '',
        },
      });
      expect(response.status).toBe(403);
    });

    it('rejects whitespace admin token', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': '   ',
        },
      });
      expect(response.status).toBe(403);
    });

    it('rejects partial match admin token', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': 'test-admin', // Partial match
        },
      });
      expect(response.status).toBe(403);
    });

    it('rejects case-different admin token', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': 'TEST-ADMIN-TOKEN', // Different case
        },
      });
      expect(response.status).toBe(403);
    });

    it('rejects token with extra characters', async () => {
      const response = await fetch('/api/admin/applications/pending', {
        headers: {
          'x-admin-token': 'test-admin-token-extra',
        },
      });
      expect(response.status).toBe(403);
    });
  });
});
