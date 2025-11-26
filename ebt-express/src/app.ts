import express from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from './prisma';
import { fetchOnchainMetadata, OnchainMint } from './services/mintEvents';
import { requireAdmin } from './middleware/admin';
import { requirePrivyAuth } from './middleware/auth';
import {
  checkUsernameSchema,
  updateUserDataSchema,
  createApplicationSchema,
  mintRecordSchema,
  adminApproveSchema,
  adminRejectSchema,
  scoringConfigSchema,
  nftBoostConfigSchema,
  tokenBoostConfigSchema,
} from './validation';
import {
  approveApplication,
  rejectApplication,
  getPendingApplications,
  getApplicationDetails,
  snapshotWallet,
} from './services/approval';
import { getScoreForApplication, calculateScore } from './services/scoring';
import { checkIPFSHealth } from './services/ipfs';
import { checkTokenLiquidity, getETHBalance } from './services/uniswap';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

export const app = express();

app.use(limiter);
app.use(express.json());
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - start,
      })
    );
  });
  next();
});

app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('healthcheck failed', err);
    res.status(500).json({ status: 'error' });
  }
});

app.post('/api/checkusername', writeLimiter, async (req, res, next) => {
  try {
    const parsed = checkUsernameSchema.parse(req.body);
    const { username } = parsed;

    const existing = await prisma.application.findFirst({
      where: { username },
    });
    if (existing) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    return res.status(200).json({ message: 'Username is available.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/update-user-data', writeLimiter, requirePrivyAuth, async (req, res, next) => {
  try {
    const parsed = updateUserDataSchema.parse(req.body);
    if (parsed.step !== 1) {
      return res.status(400).json({ error: 'Invalid step.' });
    }

    const username = parsed.data.username;
    const userId = parsed.data.userId || username;
    const existing = await prisma.application.findFirst({
      where: { OR: [{ username }, { userId }] },
    });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const application = await prisma.application.create({
      data: {
        username,
        userId,
        walletAddress: parsed.data.walletAddress || '',
        profilePicURL: parsed.data.profilePicURL,
        twitter: parsed.data.twitter,
      },
    });

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username },
    });

    return res.status(200).json({ message: 'Data updated successfully.', application });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/applications', writeLimiter, requirePrivyAuth, async (req, res, next) => {
  try {
    const parsed = createApplicationSchema.parse(req.body);

    // Check if user already applied (by userId or username)
    const existingByUser = await prisma.application.findFirst({
      where: { OR: [{ userId: parsed.userId }, { username: parsed.username }] },
    });
    if (existingByUser) {
      return res.status(409).json({
        error: 'User already applied.',
        existingApplication: {
          id: existingByUser.id,
          status: existingByUser.status,
          username: existingByUser.username,
        },
      });
    }

    // Check for duplicate social accounts (twitter, discord, github, email)
    const socialConditions = [];
    if (parsed.twitter) socialConditions.push({ twitter: parsed.twitter });
    if (parsed.discord) socialConditions.push({ discord: parsed.discord });
    if (parsed.github) socialConditions.push({ github: parsed.github });
    if (parsed.email) socialConditions.push({ email: parsed.email });

    if (socialConditions.length > 0) {
      const existingBySocial = await prisma.application.findFirst({
        where: { OR: socialConditions },
      });
      if (existingBySocial) {
        const matchedAccount =
          (parsed.twitter && existingBySocial.twitter === parsed.twitter && 'Twitter') ||
          (parsed.discord && existingBySocial.discord === parsed.discord && 'Discord') ||
          (parsed.github && existingBySocial.github === parsed.github && 'GitHub') ||
          (parsed.email && existingBySocial.email === parsed.email && 'Email') ||
          'Social account';

        return res.status(409).json({
          error: `${matchedAccount} already linked to another application.`,
          existingApplication: {
            id: existingBySocial.id,
            status: existingBySocial.status,
            username: existingBySocial.username,
          },
          duplicateSocial: matchedAccount,
        });
      }
    }

    const application = await prisma.application.create({
      data: {
        ...parsed,
        status: 'pending',
      },
    });

    await prisma.user.upsert({
      where: { username: parsed.username },
      update: {},
      create: { username: parsed.username },
    });

    return res.status(201).json({ application });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/applications/:userId', requirePrivyAuth, async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({ where: { userId: req.params.userId } });
    if (!application) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json({ application });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/applications/:userId/approve', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({ where: { userId: req.params.userId } });
    if (!application) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: 'approved', approvedAt: new Date() },
    });

    return res.status(200).json({ application: updated });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/mints', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = mintRecordSchema.parse(req.body);

    const application = await prisma.application.findFirst({ where: { userId: parsed.userId } });
    if (!application) {
      return res.status(404).json({ error: 'application not found for userId' });
    }

    const existing = await prisma.mint.findUnique({ where: { tokenId: parsed.tokenId } });
    if (existing) {
      return res.status(409).json({ error: 'tokenId already recorded.' });
    }

    const mint = await prisma.mint.create({
      data: {
        tokenId: parsed.tokenId,
        userId: parsed.userId,
        accountAddress: parsed.accountAddress,
        metadataURI: parsed.metadataURI,
        metadata: parsed.metadata ? JSON.stringify(parsed.metadata) : null,
        applicationId: application.id,
      },
    });

    await prisma.application.update({
      where: { id: application.id },
      data: { mintedTokenId: parsed.tokenId, metadataURI: parsed.metadataURI ?? application.metadataURI },
    });

    return res.status(201).json({ mint });
  } catch (error) {
    return next(error);
  }
});

// Platform stats endpoint for landing page
app.get('/api/stats/platform', async (_req, res, next) => {
  try {
    // Get total mints
    const totalMinted = await prisma.mint.count();

    // Calculate total raised (0.02 ETH per mint)
    const mintPrice = 0.02;
    const totalRaised = totalMinted * mintPrice;

    // Get unique holders (each mint = 1 holder for now)
    const totalHolders = totalMinted;

    // Get pending applications
    const pendingApplications = await prisma.application.count({
      where: { status: 'pending' },
    });

    // Get approved applications
    const approvedApplications = await prisma.application.count({
      where: { status: 'approved' },
    });

    // Calculate next monthly drop (first of each month at midnight UTC)
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    const nextDropTime = nextMonth.toISOString();

    return res.status(200).json({
      totalMinted,
      totalRaised: totalRaised.toFixed(4),
      totalRaisedWei: BigInt(Math.floor(totalRaised * 1e18)).toString(),
      totalHolders,
      pendingApplications,
      approvedApplications,
      nextDropTime,
      mintPrice: mintPrice.toString(),
      softCap: '25', // 25 ETH
      hardCap: '50', // 50 ETH
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/metadata/:tokenId', async (req, res, next) => {
  try {
    const tokenId = Number(req.params.tokenId);
    if (Number.isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid tokenId' });
    }

    const mint = await prisma.mint.findUnique({ where: { tokenId } });
    const onchain: OnchainMint | null = await fetchOnchainMetadata(tokenId);

    if (!mint && !onchain) {
      return res.status(404).json({ error: 'Not found' });
    }

    let metadata: unknown = onchain?.metadata;
    if (mint?.metadata) {
      try {
        metadata = JSON.parse(mint.metadata);
      } catch {
        metadata = mint.metadata;
      }
    }

    return res.status(200).json({
      tokenId,
      userId: mint?.userId ?? onchain?.userId,
      metadataURI: mint?.metadataURI ?? onchain?.metadataURI,
      metadata,
      accountAddress: mint?.accountAddress ?? onchain?.accountAddress,
    });
  } catch (error) {
    return next(error);
  }
});

// ==================== ADMIN ROUTES ====================

// Get all pending applications
app.get('/api/admin/applications/pending', requireAdmin, async (_req, res, next) => {
  try {
    const applications = await getPendingApplications();
    return res.status(200).json({ applications });
  } catch (error) {
    return next(error);
  }
});

// Get application details with wallet snapshot and generated card
app.get('/api/admin/applications/:id', requireAdmin, async (req, res, next) => {
  try {
    const applicationId = Number(req.params.id);
    if (Number.isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    const application = await getApplicationDetails(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.status(200).json({ application });
  } catch (error) {
    return next(error);
  }
});

// Approve application - generates card, pins to IPFS
app.post('/api/admin/applications/approve', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = adminApproveSchema.parse(req.body);
    const result = await approveApplication(parsed.applicationId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

// Reject application
app.post('/api/admin/applications/reject', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = adminRejectSchema.parse(req.body);
    await rejectApplication(parsed.applicationId, parsed.reason);
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// Take wallet snapshot for an application
app.post('/api/admin/applications/:id/snapshot', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const applicationId = Number(req.params.id);
    if (Number.isNaN(applicationId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!application.walletAddress) {
      return res.status(400).json({ error: 'Application has no wallet address' });
    }

    const snapshot = await snapshotWallet(application.walletAddress, applicationId);
    return res.status(200).json({ snapshot });
  } catch (error) {
    return next(error);
  }
});

// ==================== SCORING CONFIG ROUTES ====================

// Get all scoring configs
app.get('/api/admin/scoring-configs', requireAdmin, async (_req, res, next) => {
  try {
    const configs = await prisma.scoringConfig.findMany({
      orderBy: { category: 'asc' },
    });
    return res.status(200).json({ configs });
  } catch (error) {
    return next(error);
  }
});

// Create/update scoring config
app.post('/api/admin/scoring-configs', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = scoringConfigSchema.parse(req.body);
    const config = await prisma.scoringConfig.upsert({
      where: { name: parsed.name },
      update: parsed,
      create: parsed,
    });
    return res.status(200).json({ config });
  } catch (error) {
    return next(error);
  }
});

// ==================== NFT BOOST CONFIG ROUTES ====================

// Get all NFT boost configs
app.get('/api/admin/nft-boosts', requireAdmin, async (_req, res, next) => {
  try {
    const configs = await prisma.nFTBoostConfig.findMany();
    return res.status(200).json({ configs });
  } catch (error) {
    return next(error);
  }
});

// Create/update NFT boost config
app.post('/api/admin/nft-boosts', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = nftBoostConfigSchema.parse(req.body);
    const config = await prisma.nFTBoostConfig.upsert({
      where: { contractAddress: parsed.contractAddress },
      update: parsed,
      create: parsed,
    });
    return res.status(200).json({ config });
  } catch (error) {
    return next(error);
  }
});

// ==================== TOKEN BOOST CONFIG ROUTES ====================

// Get all token boost configs
app.get('/api/admin/token-boosts', requireAdmin, async (_req, res, next) => {
  try {
    const configs = await prisma.tokenBoostConfig.findMany();
    return res.status(200).json({ configs });
  } catch (error) {
    return next(error);
  }
});

// Create/update token boost config
app.post('/api/admin/token-boosts', writeLimiter, requireAdmin, async (req, res, next) => {
  try {
    const parsed = tokenBoostConfigSchema.parse(req.body);
    const config = await prisma.tokenBoostConfig.upsert({
      where: { contractAddress: parsed.contractAddress },
      update: parsed,
      create: parsed,
    });
    return res.status(200).json({ config });
  } catch (error) {
    return next(error);
  }
});

// Check token liquidity
app.get('/api/admin/token-liquidity/:address', requireAdmin, async (req, res, next) => {
  try {
    const result = await checkTokenLiquidity(req.params.address);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
});

// ==================== PUBLIC USER ROUTES ====================

// Lookup application by wallet address (for returning users)
app.get('/api/applications/wallet/:walletAddress', async (req, res, next) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();

    const application = await prisma.application.findFirst({
      where: {
        walletAddress: {
          equals: walletAddress,
          mode: 'insensitive',
        },
      },
      include: {
        walletSnapshot: true,
        generatedCard: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'No application found for this wallet' });
    }

    // Check if user has minted on-chain
    const mint = await prisma.mint.findFirst({
      where: { applicationId: application.id },
    });

    return res.status(200).json({
      application: {
        id: application.id,
        userId: application.userId,
        username: application.username,
        status: application.status,
        profilePicURL: application.profilePicURL,
        twitter: application.twitter,
        discord: application.discord,
        telegram: application.telegram,
        github: application.github,
        walletAddress: application.walletAddress,
        score: application.score,
        mintedTokenId: application.mintedTokenId,
        generatedCard: application.generatedCard,
        createdAt: application.createdAt,
        approvedAt: application.approvedAt,
      },
      hasMinted: !!mint,
      mint: mint
        ? {
            tokenId: mint.tokenId,
            accountAddress: mint.accountAddress,
            mintedAt: mint.mintedAt,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
});

// Get user's application with score breakdown
app.get('/api/profile/:userId', requirePrivyAuth, async (req, res, next) => {
  try {
    const application = await prisma.application.findFirst({
      where: { userId: req.params.userId },
      include: {
        walletSnapshot: true,
        generatedCard: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Calculate current score if we have wallet data
    let currentScore = null;
    if (application.walletSnapshot) {
      currentScore = await calculateScore(
        {
          twitter: application.twitter,
          discord: application.discord,
          telegram: application.telegram,
          github: application.github,
          email: application.email,
          hungerLevel: application.hungerLevel,
          dependents: application.dependents,
        },
        {
          ethBalance: application.walletSnapshot.ethBalance,
          nftHoldings: application.walletSnapshot.nftHoldings
            ? JSON.parse(application.walletSnapshot.nftHoldings) as { contractAddress: string; balance: number }[]
            : undefined,
          tokenHoldings: application.walletSnapshot.tokenHoldings
            ? JSON.parse(application.walletSnapshot.tokenHoldings) as { contractAddress: string; balance: string; usdValue: number }[]
            : undefined,
        }
      );
    }

    return res.status(200).json({
      profile: {
        userId: application.userId,
        username: application.username,
        profilePicURL: application.profilePicURL,
        status: application.status,
        score: application.score,
        scoreBreakdown: application.scoreBreakdown,
        currentScore,
        twitter: application.twitter,
        discord: application.discord,
        telegram: application.telegram,
        github: application.github,
        walletAddress: application.walletAddress,
        generatedCard: application.generatedCard,
        createdAt: application.createdAt,
        approvedAt: application.approvedAt,
        mintedTokenId: application.mintedTokenId,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Get wallet balance info
app.get('/api/wallet/:address/balance', async (req, res, next) => {
  try {
    const balance = await getETHBalance(req.params.address);
    return res.status(200).json(balance);
  } catch (error) {
    return next(error);
  }
});

// ==================== LEADERBOARD ROUTES ====================

// Get leaderboard data
app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const category = (req.query.category as string) || 'total';
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    // All categories use score for now (streaks tracking would need schema update)
    const orderBy: Record<string, 'asc' | 'desc'> = { score: 'desc' };

    const applications = await prisma.application.findMany({
      where: {
        status: { in: ['approved', 'minted'] },
      },
      orderBy,
      take: limit,
      select: {
        userId: true,
        username: true,
        profilePicURL: true,
        score: true,
        twitter: true,
        discord: true,
        github: true,
        email: true,
        mintedTokenId: true,
      },
    });

    const leaderboard = applications.map((app, index) => {
      // Calculate social score (number of linked accounts * 100)
      const socialScore =
        (app.twitter ? 100 : 0) +
        (app.discord ? 100 : 0) +
        (app.github ? 150 : 0) +
        (app.email ? 50 : 0);

      let value = app.score ?? 0;
      let valueLabel = '$FOOD';

      if (category === 'streaks') {
        // Streaks not yet tracked in DB, use score as placeholder
        value = app.mintedTokenId ? 1 : 0;
        valueLabel = 'claims';
      } else if (category === 'social') {
        value = socialScore;
        valueLabel = 'social score';
      }

      return {
        rank: index + 1,
        userId: app.userId,
        username: app.username,
        profilePic: app.profilePicURL || '',
        value,
        valueLabel,
        badges: app.mintedTokenId ? ['Minted'] : [],
        hasMinted: !!app.mintedTokenId,
      };
    });

    return res.status(200).json({
      category,
      leaderboard,
      totalCount: applications.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

// Get user's rank
app.get('/api/leaderboard/rank/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userApp = await prisma.application.findFirst({
      where: { userId },
      select: { score: true },
    });

    if (!userApp || userApp.score === null) {
      return res.status(200).json({ rank: null, message: 'Not ranked' });
    }

    const higherRanked = await prisma.application.count({
      where: {
        status: { in: ['approved', 'minted'] },
        score: { gt: userApp.score },
      },
    });

    return res.status(200).json({
      rank: higherRanked + 1,
      score: userApp.score,
    });
  } catch (error) {
    return next(error);
  }
});

// ==================== HEALTH CHECKS ====================

// Check IPFS status
app.get('/api/health/ipfs', async (_req, res) => {
  const healthy = await checkIPFSHealth();
  return res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable' });
});

// ==================== ERROR HANDLER ====================

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: err });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ error: 'Database error', message: err.message });
  }

  res.status(500).json({ error: 'Internal server error', message: err.message });
});
