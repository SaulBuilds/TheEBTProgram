'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/layout/Navbar';
import { DitheredVideoBackground } from '@/components/ui/DitheredVideoBackground';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { GalleryGeneratorForm } from '@/components/gallery/GalleryGeneratorForm';
import { LightboxModal } from '@/components/gallery/LightboxModal';
import { useGallery, MemeItem } from '@/lib/hooks/useGallery';

interface MemeInfo {
  remaining: number;
  dailyLimit: number;
  resetAt: string;
}

export default function GalleryContent() {
  const { address } = useAccount();
  const { memes, loading, hasMore, loadMore, prependMeme } = useGallery({ initialLimit: 20 });
  const [selectedMeme, setSelectedMeme] = useState<MemeItem | null>(null);
  const [memeInfo, setMemeInfo] = useState<MemeInfo | null>(null);

  // Fetch rate limit info
  const fetchMemeInfo = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (address) params.set('walletAddress', address);

      const response = await fetch(`/api/memes/generate?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMemeInfo({
          remaining: data.remaining,
          dailyLimit: data.dailyLimit,
          resetAt: data.resetAt,
        });
      }
    } catch (err) {
      console.error('Failed to fetch meme info:', err);
    }
  }, [address]);

  useEffect(() => {
    fetchMemeInfo();
  }, [fetchMemeInfo]);

  const handleGenerated = (meme: { id: number; imageUrl: string; generatedAt: string }) => {
    prependMeme(meme);
    // Scroll to top to see new meme
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMemeInfoUpdate = (info: MemeInfo) => {
    setMemeInfo(info);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <DitheredVideoBackground videoSrc="/backgrounds/Fridge_Animation_Corrections_Provided.mp4" />
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            MEME GALLERY
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Browse community memes or create your own. Drag an image to remix it,
            or describe something new.
          </p>
        </motion.div>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generator (sidebar on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start"
          >
            <GalleryGeneratorForm
              onGenerated={handleGenerated}
              memeInfo={memeInfo}
              onMemeInfoUpdate={handleMemeInfoUpdate}
            />
          </motion.div>

          {/* Gallery grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <GalleryGrid
              memes={memes}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onMemeClick={setSelectedMeme}
            />
          </motion.div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={selectedMeme !== null}
        onClose={() => setSelectedMeme(null)}
        meme={selectedMeme}
      />
    </div>
  );
}
