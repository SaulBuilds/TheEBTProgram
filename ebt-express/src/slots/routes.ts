/**
 * THE GROCERY RUN - Slot Machine API Routes
 *
 * Off-chain slot machine with Privy authentication.
 * All state persisted in database.
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  executeSpin,
  shouldResetDaily,
  playedYesterday,
  playedToday,
  SYMBOLS,
  DAILY_FREE_SPINS,
  DAILY_POINTS_CAP,
} from './engine';

const router = Router();
const prisma = new PrismaClient();

// ============ TYPES ============

interface AuthenticatedRequest extends Request {
  userId?: string; // Privy user ID
}

// ============ MIDDLEWARE ============

/**
 * Verify Privy authentication
 * This should match your existing auth middleware
 */
async function requireAuth(req: AuthenticatedRequest, res: Response, next: Function) {
  // Get user ID from Privy token (adjust based on your auth setup)
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Your existing Privy verification logic
    // For now, extract from a custom header or verify JWT
    const userId = req.headers['x-privy-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// ============ ROUTES ============

/**
 * GET /api/slots/player
 * Get or create player stats
 */
router.get('/player', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    let player = await prisma.slotPlayer.findUnique({
      where: { privyUserId: userId },
    });

    if (!player) {
      // Create new player
      player = await prisma.slotPlayer.create({
        data: {
          privyUserId: userId,
        },
      });
    }

    // Check for daily reset
    if (shouldResetDaily(player.lastDailyReset)) {
      // Update streak
      let newStreak = 0;
      if (playedYesterday(player.lastPlayDate)) {
        newStreak = player.currentStreak + 1;
      } else if (playedToday(player.lastPlayDate)) {
        newStreak = player.currentStreak;
      }

      player = await prisma.slotPlayer.update({
        where: { id: player.id },
        data: {
          dailySpinsUsed: 0,
          dailyPointsWon: 0,
          lastDailyReset: new Date(),
          currentStreak: newStreak,
          longestStreak: Math.max(player.longestStreak, newStreak),
        },
      });
    }

    res.json({
      success: true,
      player: {
        totalSpins: player.totalSpins,
        totalPoints: player.totalPoints,
        highestCombo: player.highestCombo,
        biggestWin: player.biggestWin,
        jackpotsHit: player.jackpotsHit,
        dailySpinsUsed: player.dailySpinsUsed,
        dailySpinsRemaining: Math.max(0, DAILY_FREE_SPINS - player.dailySpinsUsed),
        dailyPointsWon: player.dailyPointsWon,
        dailyPointsCap: DAILY_POINTS_CAP,
        currentStreak: player.currentStreak,
        longestStreak: player.longestStreak,
        canSpin: player.dailySpinsUsed < DAILY_FREE_SPINS,
      },
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

/**
 * POST /api/slots/spin
 * Execute a spin
 */
router.post('/spin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get or create player
    let player = await prisma.slotPlayer.findUnique({
      where: { privyUserId: userId },
    });

    if (!player) {
      player = await prisma.slotPlayer.create({
        data: { privyUserId: userId },
      });
    }

    // Check for daily reset
    if (shouldResetDaily(player.lastDailyReset)) {
      let newStreak = 0;
      if (playedYesterday(player.lastPlayDate)) {
        newStreak = player.currentStreak + 1;
      }

      player = await prisma.slotPlayer.update({
        where: { id: player.id },
        data: {
          dailySpinsUsed: 0,
          dailyPointsWon: 0,
          lastDailyReset: new Date(),
          currentStreak: newStreak,
          longestStreak: Math.max(player.longestStreak, newStreak),
        },
      });
    }

    // Check if can spin
    if (player.dailySpinsUsed >= DAILY_FREE_SPINS) {
      return res.status(400).json({
        error: 'Daily spin limit reached',
        dailySpinsUsed: player.dailySpinsUsed,
        dailySpinsRemaining: 0,
      });
    }

    // Execute spin
    const result = executeSpin(userId);

    // Cap points to daily limit
    let pointsToAward = result.totalPoints;
    if (player.dailyPointsWon + pointsToAward > DAILY_POINTS_CAP) {
      pointsToAward = Math.max(0, DAILY_POINTS_CAP - player.dailyPointsWon);
    }

    // Update player stats
    const updatedPlayer = await prisma.slotPlayer.update({
      where: { id: player.id },
      data: {
        totalSpins: { increment: 1 },
        totalPoints: { increment: pointsToAward },
        dailySpinsUsed: { increment: 1 },
        dailyPointsWon: { increment: pointsToAward },
        highestCombo: Math.max(player.highestCombo, result.cascadeCount),
        biggestWin: Math.max(player.biggestWin, pointsToAward),
        jackpotsHit: result.isJackpot ? { increment: 1 } : undefined,
        lastSpinAt: new Date(),
        lastPlayDate: new Date(),
        currentStreak: playedToday(player.lastPlayDate) ? player.currentStreak : player.currentStreak + 1,
      },
    });

    // Store spin record
    await prisma.slotSpin.create({
      data: {
        playerId: player.id,
        initialGrid: JSON.stringify(result.initialGrid),
        finalGrid: JSON.stringify(result.finalGrid),
        cascadeHistory: JSON.stringify(result.cascadeHistory),
        cascadeCount: result.cascadeCount,
        basePoints: result.basePoints,
        comboMultiplier: result.comboMultiplier,
        totalPoints: pointsToAward,
        isJackpot: result.isJackpot,
        isBigWin: result.isBigWin,
        seed: result.seed,
      },
    });

    res.json({
      success: true,
      spin: {
        initialGrid: result.initialGrid,
        finalGrid: result.finalGrid,
        cascadeHistory: result.cascadeHistory,
        cascadeCount: result.cascadeCount,
        basePoints: result.basePoints,
        comboMultiplier: result.comboMultiplier,
        pointsEarned: pointsToAward,
        isJackpot: result.isJackpot,
        isBigWin: result.isBigWin,
        pointsCapped: pointsToAward < result.totalPoints,
      },
      player: {
        totalSpins: updatedPlayer.totalSpins,
        totalPoints: updatedPlayer.totalPoints,
        dailySpinsUsed: updatedPlayer.dailySpinsUsed,
        dailySpinsRemaining: Math.max(0, DAILY_FREE_SPINS - updatedPlayer.dailySpinsUsed),
        dailyPointsWon: updatedPlayer.dailyPointsWon,
        currentStreak: updatedPlayer.currentStreak,
      },
    });
  } catch (error) {
    console.error('Error executing spin:', error);
    res.status(500).json({ error: 'Failed to execute spin' });
  }
});

/**
 * GET /api/slots/history
 * Get player's spin history
 */
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const player = await prisma.slotPlayer.findUnique({
      where: { privyUserId: userId },
    });

    if (!player) {
      return res.json({ success: true, history: [] });
    }

    const spins = await prisma.slotSpin.findMany({
      where: { playerId: player.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        cascadeCount: true,
        totalPoints: true,
        isJackpot: true,
        isBigWin: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      history: spins,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch spin history' });
  }
});

/**
 * GET /api/slots/leaderboard
 * Get top players
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const period = req.query.period as string || 'all'; // 'all' or 'daily'

    let players;

    if (period === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      players = await prisma.slotPlayer.findMany({
        where: {
          lastDailyReset: { gte: today },
        },
        orderBy: { dailyPointsWon: 'desc' },
        take: limit,
        select: {
          privyUserId: true,
          dailyPointsWon: true,
          dailySpinsUsed: true,
          currentStreak: true,
        },
      });
    } else {
      players = await prisma.slotPlayer.findMany({
        orderBy: { totalPoints: 'desc' },
        take: limit,
        select: {
          privyUserId: true,
          totalPoints: true,
          totalSpins: true,
          highestCombo: true,
          jackpotsHit: true,
          longestStreak: true,
        },
      });
    }

    res.json({
      success: true,
      period,
      leaderboard: players,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/slots/symbols
 * Get symbol definitions for frontend
 */
router.get('/symbols', (req: Request, res: Response) => {
  res.json({
    success: true,
    symbols: SYMBOLS,
    config: {
      gridSize: 5,
      minMatch: 3,
      dailyFreeSpins: DAILY_FREE_SPINS,
      dailyPointsCap: DAILY_POINTS_CAP,
    },
  });
});

export default router;
