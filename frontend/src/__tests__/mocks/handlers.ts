import { http, HttpResponse } from 'msw';

// Mock contract addresses
export const MOCK_CONTRACT_ADDRESSES = {
  EBTProgram: '0x9A7809EB76D30A754b730Dcfff1286bBff0775aa',
  FoodStamps: '0xd89406651698c85423e94D932bac95fA5Ab729Ec',
  ERC6551Registry: '0xb22F642c3303bDe27131f58b46E7d75Aa194df0c',
  ERC6551Account: '0xb812Dd421F2AB112fc7c33c75369148D115bEB4E',
  EBTApplication: '0x2E84f1fFF8E37A55Cc90B2f268C0d233d5aE5045',
  LiquidityVault: '0x6d15041ce06E367776CdcE1aFf1A2fAD31f44131',
  TeamVesting: '0xa1400a541c0fE2364fd502003C5273AEFaA0D244',
};

// Mock user data
export const MOCK_USER = {
  userId: 'test-user-123',
  username: 'testuser',
  walletAddress: '0x1234567890123456789012345678901234567890',
  email: 'test@example.com',
  twitter: '@testuser',
  discord: 'testuser#1234',
  github: 'testuser',
  status: 'approved' as const,
  score: 500,
};

// Mock application data
export const MOCK_APPLICATION = {
  id: 1,
  userId: 'test-user-123',
  username: 'testuser',
  walletAddress: '0x1234567890123456789012345678901234567890',
  profilePicURL: 'https://example.com/pic.jpg',
  status: 'approved',
  score: 500,
  hungerLevel: 'starving',
  dependents: 2,
  createdAt: '2024-01-01T00:00:00.000Z',
  approvedAt: '2024-01-02T00:00:00.000Z',
};

// Mock mint data
export const MOCK_MINT = {
  id: 1,
  tokenId: 1,
  userId: 'test-user-123',
  mintPrice: '20000000000000000',
  txHash: '0xabcd1234...',
  metadataURI: 'ipfs://QmTest...',
  accountAddress: '0xTBA1234...',
};

// Mock leaderboard data (NO PII)
export const MOCK_LEADERBOARD = [
  {
    rank: 1,
    userId: 'user-1',
    username: 'top_user',
    profilePic: '',
    value: 1000,
    valueLabel: '$FOOD',
    badges: ['Minted'],
    hasMinted: true,
    hasTwitter: true,
    hasDiscord: true,
    hasGithub: true,
  },
  {
    rank: 2,
    userId: 'user-2',
    username: 'second_user',
    profilePic: '',
    value: 800,
    valueLabel: '$FOOD',
    badges: ['Minted'],
    hasMinted: true,
    hasTwitter: false,
    hasDiscord: true,
    hasGithub: false,
  },
];

export const handlers = [
  // Health check
  http.get('/api/healthz', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Leaderboard
  http.get('/api/leaderboard', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'total';
    return HttpResponse.json({
      category,
      leaderboard: MOCK_LEADERBOARD,
      totalCount: MOCK_LEADERBOARD.length,
      updatedAt: new Date().toISOString(),
    });
  }),

  // Application endpoints
  http.get('/api/applications/:userId', ({ params }) => {
    const { userId } = params;
    if (userId === 'not-found') {
      return HttpResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return HttpResponse.json({ application: { ...MOCK_APPLICATION, userId } });
  }),

  http.post('/api/applications', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      application: {
        ...MOCK_APPLICATION,
        ...body,
        id: Math.floor(Math.random() * 1000),
        status: 'pending',
      },
    });
  }),

  // Wallet application lookup
  http.get('/api/applications/wallet/:walletAddress', ({ params }) => {
    const { walletAddress } = params;
    if (walletAddress === '0x0000000000000000000000000000000000000000') {
      return HttpResponse.json({ application: null, mint: null });
    }
    return HttpResponse.json({
      application: MOCK_APPLICATION,
      mint: MOCK_MINT,
    });
  }),

  // Username check
  http.post('/api/checkusername', async ({ request }) => {
    const body = await request.json() as { username: string };
    const taken = body.username === 'taken';
    return HttpResponse.json({ available: !taken, username: body.username });
  }),

  // Metadata endpoint
  http.get('/api/metadata/:tokenId', ({ params }) => {
    const tokenIdStr = params.tokenId as string;
    // Reject non-integer strings (decimals, letters, etc.)
    if (!/^\d+$/.test(tokenIdStr)) {
      return HttpResponse.json({ error: 'Invalid tokenId' }, { status: 400 });
    }
    const tokenId = Number(tokenIdStr);
    if (isNaN(tokenId) || tokenId < 0) {
      return HttpResponse.json({ error: 'Invalid tokenId' }, { status: 400 });
    }
    if (tokenId === 999) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({
      tokenId,
      userId: 'test-user',
      metadataURI: `ipfs://QmTest${tokenId}`,
      metadata: {
        name: `EBT Card #${tokenId}`,
        description: 'An EBT Card NFT',
        image: 'ipfs://QmTestImage',
        attributes: [
          { trait_type: 'Score', value: 500 },
          { trait_type: 'Theme', value: 'default' },
        ],
      },
      accountAddress: `0xTBA${tokenId}`,
    });
  }),

  // Mints endpoint
  http.post('/api/mints', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      mint: {
        ...MOCK_MINT,
        ...body,
        id: Math.floor(Math.random() * 1000),
      },
    });
  }),

  // Admin endpoints (require admin token)
  http.get('/api/admin/applications/pending', ({ request }) => {
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== 'test-admin-token') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return HttpResponse.json({ applications: [MOCK_APPLICATION] });
  }),

  http.post('/api/admin/applications/approve', async ({ request }) => {
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== 'test-admin-token') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json() as { applicationId: number };
    return HttpResponse.json({
      application: { ...MOCK_APPLICATION, id: body.applicationId, status: 'approved' },
      score: 500,
      breakdown: [],
    });
  }),

  http.post('/api/admin/applications/reject', async ({ request }) => {
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken !== 'test-admin-token') {
      return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json() as { applicationId: number; reason?: string };
    return HttpResponse.json({
      application: {
        ...MOCK_APPLICATION,
        id: body.applicationId,
        status: 'rejected',
        rejectionReason: body.reason || 'No reason provided',
      },
    });
  }),

  // Claims request (backend-triggered)
  http.post('/api/claims/request', async ({ request }) => {
    const body = await request.json() as { tokenId: string };
    return HttpResponse.json({
      success: true,
      tokenId: body.tokenId,
      message: 'Claim request submitted',
    });
  }),
];
