'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';

// Re-export the type for other components
export type { ApplicationData } from './ApplyContent';

const ApplyContent = dynamic(() => import('./ApplyContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse text-ebt-gold font-mono">Loading...</div>
      </div>
    </div>
  ),
});

export default function ApplyPage() {
  return <ApplyContent />;
}
