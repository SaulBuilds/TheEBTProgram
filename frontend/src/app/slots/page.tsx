'use client';

import { Suspense } from 'react';
import { SlotsContent } from './SlotsContent';

export default function SlotsPage() {
  return (
    <Suspense fallback={<SlotsLoading />}>
      <SlotsContent />
    </Suspense>
  );
}

function SlotsLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-heading text-ebt-gold animate-pulse mb-4">
          LOADING...
        </div>
        <p className="text-gray-500 font-mono">Warming up the reels</p>
      </div>
    </div>
  );
}
