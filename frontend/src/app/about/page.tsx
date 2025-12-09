'use client';

import { Navbar } from '@/components/layout/Navbar';
import { AboutContent } from './AboutContent';
import { DitheredVideoBackground } from '@/components/ui/DitheredVideoBackground';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden">
      <DitheredVideoBackground videoSrc="/backgrounds/Fridge_Animation_Corrections_Provided.mp4" />
      <Navbar />
      <div className="relative z-10">
        <AboutContent />
      </div>
    </div>
  );
}
