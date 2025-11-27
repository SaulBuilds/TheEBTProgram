import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPrivyAuth } from '@/lib/auth';
import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, SEPOLIA_CHAIN_ID, CLAIM_INTERVAL, MAX_CLAIMS } from '@/lib/contracts/addresses';
import { abis } from '@/lib/contracts/config';

// Rate limiting for claim requests
const claimRateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_CLAIM_REQUESTS_PER_WINDOW = 3;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = claimRateLimits.get(userId);

  if (!limit || now > limit.resetTime) {
    claimRateLimits.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= MAX_CLAIM_REQUESTS_PER_WINDOW) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyPrivyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { tokenId } = body;

    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }

    const tokenIdBigInt = BigInt(tokenId);

    // Get mint record to find the user
    const mint = await prisma.mint.findFirst({
      where: { tokenId: Number(tokenId) },
      include: { application: true },
    });

    if (!mint) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Verify the requesting user owns this token (by userId from auth)
    if (mint.userId !== auth.userId) {
      return NextResponse.json({ error: 'Not authorized to claim for this token' }, { status: 403 });
    }

    // Rate limit check
    if (!checkRateLimit(mint.userId)) {
      return NextResponse.json(
        { error: 'Too many claim requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Create public client to read contract state
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
    });

    // Get token data from contract
    const tokenData = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTProgram as `0x${string}`,
      abi: abis.EBTProgram,
      functionName: 'tokenData',
      args: [tokenIdBigInt],
    }) as {
      mintPrice: bigint;
      claimCount: bigint;
      lastClaimTime: bigint;
      reapplicationBaseAmount: bigint;
      reapplicationStatus: number;
      tgeClaimed: boolean;
    };

    const claimCount = Number(tokenData.claimCount);
    const lastClaimTime = Number(tokenData.lastClaimTime);
    const now = Math.floor(Date.now() / 1000);

    // Check if already claimed all installments
    if (claimCount >= MAX_CLAIMS) {
      return NextResponse.json(
        { error: 'All installments have been claimed' },
        { status: 400 }
      );
    }

    // Check if enough time has passed since last claim
    // First claim has no waiting period, subsequent claims require CLAIM_INTERVAL
    if (claimCount > 0 && now < lastClaimTime + CLAIM_INTERVAL) {
      const nextClaimTime = lastClaimTime + CLAIM_INTERVAL;
      const waitSeconds = nextClaimTime - now;
      const waitDays = Math.ceil(waitSeconds / (24 * 60 * 60));
      return NextResponse.json(
        {
          error: `Next claim available in ${waitDays} days`,
          nextClaimTime,
          waitSeconds,
        },
        { status: 400 }
      );
    }

    // Verify protocol caller is configured
    if (!process.env.PROTOCOL_CALLER_PRIVATE_KEY) {
      console.error('PROTOCOL_CALLER_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Claim service not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Create wallet client with protocol caller
    const account = privateKeyToAccount(process.env.PROTOCOL_CALLER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
    });

    // Execute the claim transaction
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES[SEPOLIA_CHAIN_ID].EBTProgram as `0x${string}`,
        abi: abis.EBTProgram,
        functionName: 'claim',
        args: [tokenIdBigInt],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'reverted') {
        return NextResponse.json(
          { error: 'Claim transaction reverted' },
          { status: 500 }
        );
      }

      // Log successful claim
      console.log(`Claim successful for token ${tokenId}, tx: ${hash}`);

      return NextResponse.json({
        success: true,
        tokenId,
        txHash: hash,
        claimNumber: claimCount + 1,
        message: `Installment ${claimCount + 1} of ${MAX_CLAIMS} claimed successfully`,
      });
    } catch (txError) {
      console.error('Claim transaction error:', txError);
      return NextResponse.json(
        { error: 'Failed to execute claim transaction. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Claims request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
