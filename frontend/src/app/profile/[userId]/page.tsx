'use client';

import dynamic from 'next/dynamic';

const ProfileContent = dynamic(() => import('./ProfileContent'), { ssr: false });

export default function ProfilePage() {
  return <ProfileContent />;
}
