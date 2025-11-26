'use client';

import dynamic from 'next/dynamic';

const MintContent = dynamic(() => import('./MintContent'), { ssr: false });

export default function MintPage() {
  return <MintContent />;
}
