'use client';

import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Tokenomics } from '@/components/landing/Tokenomics';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent text-white overflow-x-hidden">
      <Navbar />

      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Tokenomics />
      </main>

      <Footer />
    </div>
  );
}