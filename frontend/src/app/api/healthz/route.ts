import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('healthcheck failed', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
