import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    return NextResponse.json({
      totalMinted,
      totalRaised: totalRaised.toFixed(4),
      totalRaisedWei: BigInt(Math.floor(totalRaised * 1e18)).toString(),
      totalHolders,
      pendingApplications,
      approvedApplications,
      nextDropTime,
      mintPrice: mintPrice.toString(),
      softCap: '25',
      hardCap: '50',
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
