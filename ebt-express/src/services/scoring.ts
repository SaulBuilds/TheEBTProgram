import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScoreBreakdown {
  category: string;
  name: string;
  points: number;
  description: string;
}

interface ScoringResult {
  totalScore: number;
  breakdown: ScoreBreakdown[];
}

interface ApplicationData {
  twitter?: string | null;
  discord?: string | null;
  telegram?: string | null;
  github?: string | null;
  email?: string | null;
  hungerLevel?: string | null;
  dependents?: number;
}

interface WalletData {
  ethBalance: string;  // in wei
  nftHoldings?: {
    contractAddress: string;
    balance: number;
  }[];
  tokenHoldings?: {
    contractAddress: string;
    balance: string;
    usdValue: number;
  }[];
}

export async function calculateScore(
  applicationData: ApplicationData,
  walletData?: WalletData
): Promise<ScoringResult> {
  const breakdown: ScoreBreakdown[] = [];
  let totalScore = 0;

  // Get all enabled scoring configs
  const scoringConfigs = await prisma.scoringConfig.findMany({
    where: { enabled: true },
  });

  // Get NFT boost configs
  const nftBoostConfigs = await prisma.nFTBoostConfig.findMany({
    where: { enabled: true },
  });

  // Get token boost configs
  const tokenBoostConfigs = await prisma.tokenBoostConfig.findMany({
    where: { enabled: true },
  });

  // Process each scoring config
  for (const config of scoringConfigs) {
    let points = 0;
    let earned = false;

    switch (config.name) {
      // Social connections
      case 'twitter_connected':
        if (applicationData.twitter) {
          earned = true;
          points = config.weight;
        }
        break;

      case 'discord_connected':
        if (applicationData.discord) {
          earned = true;
          points = config.weight;
        }
        break;

      case 'telegram_connected':
        if (applicationData.telegram) {
          earned = true;
          points = config.weight;
        }
        break;

      case 'github_connected':
        if (applicationData.github) {
          earned = true;
          points = config.weight;
        }
        break;

      case 'email_verified':
        if (applicationData.email) {
          earned = true;
          points = config.weight;
        }
        break;

      // ETH balance tiers
      case 'eth_balance_tier1':
      case 'eth_balance_tier2':
      case 'eth_balance_tier3':
        if (walletData?.ethBalance) {
          const metadata = config.metadata ? JSON.parse(config.metadata) as { minBalance?: string } : null;
          const minBalance = BigInt(metadata?.minBalance || '0');
          const balance = BigInt(walletData.ethBalance);
          if (balance >= minBalance) {
            earned = true;
            points = config.weight;
          }
        }
        break;

      // NFT holder bonus
      case 'nft_holder':
        if (walletData?.nftHoldings && walletData.nftHoldings.length > 0) {
          // Check if any holdings match our boost list
          for (const holding of walletData.nftHoldings) {
            const matchingConfig = nftBoostConfigs.find(
              (c) => c.contractAddress.toLowerCase() === holding.contractAddress.toLowerCase()
            );
            if (matchingConfig && holding.balance >= matchingConfig.minBalance) {
              earned = true;
              // Use the NFT-specific boost points, capped at maxBoost if set
              let nftPoints = matchingConfig.boostPoints * holding.balance;
              if (matchingConfig.maxBoost) {
                nftPoints = Math.min(nftPoints, matchingConfig.maxBoost);
              }
              points += nftPoints;

              breakdown.push({
                category: 'nft',
                name: `${matchingConfig.name} (x${holding.balance})`,
                points: nftPoints,
                description: `Holding ${holding.balance} ${matchingConfig.symbol || 'NFT'}`,
              });
            }
          }
        }
        break;

      // Token holder bonus
      case 'token_holder':
        if (walletData?.tokenHoldings && walletData.tokenHoldings.length > 0) {
          for (const holding of walletData.tokenHoldings) {
            const matchingConfig = tokenBoostConfigs.find(
              (c) => c.contractAddress.toLowerCase() === holding.contractAddress.toLowerCase()
            );
            if (matchingConfig && holding.usdValue >= matchingConfig.minBalanceUSD) {
              earned = true;
              points += matchingConfig.boostPoints;

              breakdown.push({
                category: 'token',
                name: `${matchingConfig.name} holder`,
                points: matchingConfig.boostPoints,
                description: `Holding $${holding.usdValue.toFixed(2)} worth of ${matchingConfig.symbol}`,
              });
            }
          }
        }
        break;

      // Application-specific bonuses
      case 'hunger_starving':
        if (applicationData.hungerLevel === 'starving') {
          earned = true;
          points = config.weight;
        }
        break;

      case 'dependents_bonus':
        if (applicationData.dependents && applicationData.dependents > 0) {
          const metadata = config.metadata ? JSON.parse(config.metadata) as { maxDependents?: number } : null;
          const maxDeps = metadata?.maxDependents || 5;
          const deps = Math.min(applicationData.dependents, maxDeps);
          earned = true;
          points = config.weight * deps;
        }
        break;
    }

    if (earned && points > 0) {
      // Don't double-add NFT/token breakdowns (they're added inline above)
      if (config.name !== 'nft_holder' && config.name !== 'token_holder') {
        breakdown.push({
          category: config.category,
          name: config.name,
          points,
          description: config.description || config.name,
        });
      }
      totalScore += points;
    }
  }

  return {
    totalScore,
    breakdown,
  };
}

export async function getScoreForApplication(applicationId: number): Promise<ScoringResult> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { walletSnapshot: true },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  const applicationData: ApplicationData = {
    twitter: application.twitter,
    discord: application.discord,
    telegram: application.telegram,
    github: application.github,
    email: application.email,
    hungerLevel: application.hungerLevel,
    dependents: application.dependents,
  };

  let walletData: WalletData | undefined;
  if (application.walletSnapshot) {
    walletData = {
      ethBalance: application.walletSnapshot.ethBalance,
      nftHoldings: application.walletSnapshot.nftHoldings
        ? JSON.parse(application.walletSnapshot.nftHoldings) as WalletData['nftHoldings']
        : undefined,
      tokenHoldings: application.walletSnapshot.tokenHoldings
        ? JSON.parse(application.walletSnapshot.tokenHoldings) as WalletData['tokenHoldings']
        : undefined,
    };
  }

  return calculateScore(applicationData, walletData);
}
