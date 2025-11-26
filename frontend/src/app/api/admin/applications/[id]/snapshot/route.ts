import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/auth';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const applicationId = parseInt(id, 10);

    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { walletSnapshot: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get ETH balance
    const ethBalance = await publicClient.getBalance({
      address: application.walletAddress as `0x${string}`,
    });

    // In production, you would also check NFT and token holdings here
    // For now, we'll set defaults
    const nftBoostTotal = 0;
    const tokenBoostTotal = 0;

    // Upsert wallet snapshot
    const snapshot = await prisma.walletSnapshot.upsert({
      where: { applicationId },
      create: {
        applicationId,
        ethBalance: ethBalance.toString(),
        nftHoldings: JSON.stringify([]),
        tokenHoldings: JSON.stringify([]),
        nftBoostTotal,
        tokenBoostTotal,
      },
      update: {
        ethBalance: ethBalance.toString(),
        nftHoldings: JSON.stringify([]),
        tokenHoldings: JSON.stringify([]),
        nftBoostTotal,
        tokenBoostTotal,
        snapshotAt: new Date(),
      },
    });

    return NextResponse.json({
      snapshot,
      ethBalanceFormatted: (Number(ethBalance) / 1e18).toFixed(6) + ' ETH',
    });
  } catch (error) {
    console.error('Snapshot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
