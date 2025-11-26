'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';

const DashboardContent = dynamic(() => import('./DashboardContent'), {
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

export default function DashboardPage() {
  return <DashboardContent />;
}
