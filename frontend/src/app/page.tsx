'use client';

import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { Features } from '@/components/landing/Features';
import { MemeGallery } from '@/components/landing/MemeGallery';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Tokenomics } from '@/components/landing/Tokenomics';
import { Footer } from '@/components/landing/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { DitheredVideoBackground } from '@/components/ui/DitheredVideoBackground';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero section with ebt-video.mp4 background */}
        <section className="relative">
          <DitheredVideoBackground videoSrc="/ebt-video.mp4" fixed={false} />
          <div className="relative z-10">
            <Hero />
          </div>
        </section>

        {/* Middle sections with black background */}
        <section className="relative bg-black">
          <Stats />
          <Features />
          <MemeGallery />
          <HowItWorks />
        </section>

        {/* Tokenomics and Footer with Pixelated Pie video background */}
        <section className="relative">
          <DitheredVideoBackground
            videoSrc="/backgrounds/Pixelated_Pie_Video_With_Sunrise.mp4"
            fixed={false}
          />
          <div className="relative z-10">
            <Tokenomics />
            <Footer />
          </div>
        </section>
      </main>
    </div>
  );
}