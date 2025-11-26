import { PrismaClient } from '@prisma/client';
import { generateCardImage } from './cardGenerator';
import { pinNFTMetadata } from './ipfs';
import { calculateScore } from './scoring';
import { getETHBalance, checkMultipleTokens } from './uniswap';

const prisma = new PrismaClient();

interface ApprovalResult {
  success: boolean;
  applicationId: number;
  score: number;
  metadataUri: string;
  imageCid: string;
  metadataCid: string;
  imageGatewayUrl: string;
  metadataGatewayUrl: string;
}

interface WalletSnapshot {
  ethBalance: string;
  nftHoldings: {
    contractAddress: string;
    balance: number;
  }[];
  tokenHoldings: {
    contractAddress: string;
    balance: string;
    usdValue: number;
  }[];
}

/**
 * Take a snapshot of the user's wallet holdings
 */
export async function snapshotWallet(
  walletAddress: string,
  applicationId: number
): Promise<WalletSnapshot> {
  // Get ETH balance
  const ethBalance = await getETHBalance(walletAddress);

  // Get configured token addresses to check
  const tokenConfigs = await prisma.tokenBoostConfig.findMany({
    where: { enabled: true },
  });

  const tokenAddresses = tokenConfigs.map((t) => t.contractAddress);

  // Check token balances and liquidity
  const tokenInfos = await checkMultipleTokens(tokenAddresses, walletAddress);

  const tokenHoldings = tokenInfos
    .filter((t) => Number(t.balance) > 0)
    .map((t) => ({
      contractAddress: t.address,
      balance: t.balance,
      usdValue: t.usdValue,
    }));

  // Get configured NFT addresses to check
  const nftConfigs = await prisma.nFTBoostConfig.findMany({
    where: { enabled: true },
  });

  // For NFTs, we'd need to query balanceOf for each - simplified for now
  const nftHoldings: { contractAddress: string; balance: number }[] = [];

  // Store snapshot in database
  await prisma.walletSnapshot.upsert({
    where: { applicationId },
    update: {
      ethBalance: ethBalance.balance,
      nftHoldings: JSON.stringify(nftHoldings),
      tokenHoldings: JSON.stringify(tokenHoldings),
      snapshotAt: new Date(),
    },
    create: {
      applicationId,
      ethBalance: ethBalance.balance,
      nftHoldings: JSON.stringify(nftHoldings),
      tokenHoldings: JSON.stringify(tokenHoldings),
    },
  });

  return {
    ethBalance: ethBalance.balance,
    nftHoldings,
    tokenHoldings,
  };
}

/**
 * Process and approve an application
 * - Calculate score
 * - Generate NFT card image
 * - Pin to IPFS
 * - Update application with metadata URI
 */
export async function approveApplication(
  applicationId: number
): Promise<ApprovalResult> {
  // Get the application
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { walletSnapshot: true },
  });

  if (!application) {
    throw new Error('Application not found');
  }

  if (application.status === 'approved') {
    throw new Error('Application already approved');
  }

  // Take wallet snapshot if not already done
  let walletData = application.walletSnapshot;
  if (!walletData && application.walletAddress) {
    const snapshot = await snapshotWallet(application.walletAddress, applicationId);
    walletData = await prisma.walletSnapshot.findUnique({
      where: { applicationId },
    });
  }

  // Calculate score
  const scoringResult = await calculateScore(
    {
      twitter: application.twitter,
      discord: application.discord,
      telegram: application.telegram,
      github: application.github,
      email: application.email,
      hungerLevel: application.hungerLevel,
      dependents: application.dependents,
    },
    walletData
      ? {
          ethBalance: walletData.ethBalance,
          nftHoldings: walletData.nftHoldings
            ? JSON.parse(walletData.nftHoldings) as WalletSnapshot['nftHoldings']
            : undefined,
          tokenHoldings: walletData.tokenHoldings
            ? JSON.parse(walletData.tokenHoldings) as WalletSnapshot['tokenHoldings']
            : undefined,
        }
      : undefined
  );

  // Generate NFT card image
  const cardResult = await generateCardImage({
    userId: application.userId,
    username: application.username,
    profilePicURL: application.profilePicURL || undefined,
    zipCode: application.zipCode || undefined,
    score: scoringResult.totalScore,
    badges: [],
    twitter: application.twitter || undefined,
    discord: application.discord || undefined,
    telegram: application.telegram || undefined,
    github: application.github || undefined,
  });

  // Pin to IPFS
  const ipfsResult = await pinNFTMetadata(
    cardResult.imageBuffer,
    cardResult.metadata,
    application.userId
  );

  // Update application with score and metadata
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: 'approved',
      score: scoringResult.totalScore,
      scoreBreakdown: JSON.parse(JSON.stringify(scoringResult.breakdown)),
      approvedAt: new Date(),
    },
  });

  // Store generated card info
  await prisma.generatedCard.upsert({
    where: { applicationId },
    update: {
      imageCid: ipfsResult.imageCid,
      metadataCid: ipfsResult.metadataCid,
      imageUrl: ipfsResult.imageUrl,
      metadataUrl: ipfsResult.metadataUrl,
      prompt: cardResult.prompt,
      theme: cardResult.theme,
    },
    create: {
      applicationId,
      imageCid: ipfsResult.imageCid,
      metadataCid: ipfsResult.metadataCid,
      imageUrl: ipfsResult.imageUrl,
      metadataUrl: ipfsResult.metadataUrl,
      prompt: cardResult.prompt,
      theme: cardResult.theme,
    },
  });

  return {
    success: true,
    applicationId,
    score: scoringResult.totalScore,
    metadataUri: ipfsResult.metadataUrl,
    imageCid: ipfsResult.imageCid,
    metadataCid: ipfsResult.metadataCid,
    imageGatewayUrl: ipfsResult.imageGatewayUrl,
    metadataGatewayUrl: ipfsResult.metadataGatewayUrl,
  };
}

/**
 * Reject an application
 */
export async function rejectApplication(
  applicationId: number,
  reason?: string
): Promise<void> {
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: 'rejected',
      rejectionReason: reason,
    },
  });
}

/**
 * Get all pending applications for admin review
 */
export async function getPendingApplications() {
  return prisma.application.findMany({
    where: { status: 'pending' },
    include: {
      walletSnapshot: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get application details with all related data
 */
export async function getApplicationDetails(applicationId: number) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      walletSnapshot: true,
      generatedCard: true,
    },
  });
}
