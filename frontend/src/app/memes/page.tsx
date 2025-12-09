'use client';

import dynamic from 'next/dynamic';

// Dynamically import the content to avoid SSR issues with wagmi
const MemeGeneratorContent = dynamic(() => import('./MemeGeneratorContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-ebt-gold border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function MemeGeneratorPage() {
  return <MemeGeneratorContent />;
}
