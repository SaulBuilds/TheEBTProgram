'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { GlitchText } from '@/components/ui/GlitchText';
import { Button } from '@/components/ui/Button';
import { TypewriterText } from '@/components/ui/TypewriterText';

// Dynamically import MemeCardPreview to avoid SSR issues with wagmi hooks
const MemeCardPreview = dynamic(
  () => import('./MemeCardPreview').then((mod) => mod.MemeCardPreview),
  {
    ssr: false,
    loading: () => (
      <div className="relative mx-auto w-full max-w-2xl mb-12">
        <div className="bg-black/60 backdrop-blur-sm border border-ebt-gold/30 rounded-2xl p-2">
          <div className="w-full aspect-[3/2] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-ebt-gold border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    ),
  }
);

const headlines = [
  "THEY PRINTED $6 TRILLION. WE PRINTED THE CARD.",
  "THE FED IS A MEME COIN WITH A MARKETING BUDGET.",
  "YOUR PARENTS HAD PENSIONS. YOU HAVE JPGS.",
  "EVERYONE IS ON ASSISTANCE. SOME ARE JUST HONEST.",
  "THE LINE STARTS HERE."
];

export function Hero() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();
  const [currentHeadline, setCurrentHeadline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (!authenticated) {
      login();
    } else {
      router.push('/apply');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Glitch title */}
        <div className="mb-8">
          <GlitchText
            text="EBT CARD"
            className="text-7xl md:text-9xl font-heading text-ebt-gold tracking-wider"
          />
        </div>

        {/* Rotating headlines */}
        <div className="h-16 mb-8">
          <TypewriterText
            key={currentHeadline}
            text={headlines[currentHeadline]}
            className="text-2xl md:text-4xl font-heading text-white tracking-wide"
          />
        </div>

        {/* EBT Card Meme Machine */}
        <MemeCardPreview onConnectClick={login} />

        {/* Tagline */}
        <div className="bg-black/60 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6 max-w-2xl mx-auto mb-8">
          <p className="text-xl md:text-2xl mb-2 font-heading text-ebt-green tracking-wide">
            The safety net they promised. Deployed on the only infrastructure that works.
          </p>
          <p className="text-lg md:text-xl text-gray-400">
            PPP got $800B. Linda got 8 years. You get an NFT. Fair is fair.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleGetStarted}
            size="lg"
            variant="primary"
            className="group relative overflow-hidden font-heading tracking-wide"
            disabled={!ready}
          >
            <span className="relative z-10 flex items-center gap-2">
              {!authenticated ? 'ENTER THE PROGRAM' : 'MINT THE CARD'}
              <span className="animate-pulse">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-ebt-gold to-welfare-red transform translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
          </Button>

          <Button
            onClick={() => router.push('/about')}
            size="lg"
            variant="secondary"
            className="border-2 border-ebt-gold/50 hover:border-ebt-gold font-heading tracking-wide"
          >
            READ THE LORE
          </Button>
        </div>

        {/* Slots CTA - Small promo banner */}
        <div
          onClick={() => router.push('/slots')}
          className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-900/60 to-green-900/60 border border-purple-500/50 rounded-full cursor-pointer hover:border-purple-400 hover:from-purple-900/80 hover:to-green-900/80 transition-all group"
        >
          <span className="text-2xl animate-bounce">🎰</span>
          <span className="text-white font-heading tracking-wide text-sm">
            PLAY THE GROCERY RUN
          </span>
          <span className="text-green-400 font-bold text-sm">
            WIN 2 ETH
          </span>
          <span className="text-purple-300 group-hover:translate-x-1 transition-transform">→</span>
        </div>

        {/* Stats bar */}
        <div className="mt-12 bg-black/60 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div>
              <span className="text-ebt-gold font-heading text-lg">$6T</span>
              <span className="text-gray-500 ml-2">PRINTED 2020-21</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <div>
              <span className="text-ebt-gold font-heading text-lg">$100B+</span>
              <span className="text-gray-500 ml-2">PPP FRAUD</span>
            </div>
            <div className="w-px h-4 bg-gray-700" />
            <div>
              <span className="text-ebt-gold font-heading text-lg">$8,000</span>
              <span className="text-gray-500 ml-2">LINDA&apos;S CONVICTION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
