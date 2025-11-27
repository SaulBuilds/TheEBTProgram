'use client';

import { redirect } from 'next/navigation';
import { featureFlags } from '@/config/featureFlags';
import RefundContent from './RefundContent';

export default function RefundPage() {
  // Feature flag check - redirect if not enabled
  if (!featureFlags.refundPage) {
    redirect('/');
  }

  return <RefundContent />;
}
