'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { getRandomTweet } from '@/lib/tweet-generator';

// Static meme images to show before generation
const STATIC_MEMES = [
  '/EBT_MEMES/we accept ebt.jpeg',
  '/EBT_MEMES/EBT_MEME_1.png',
  '/EBT_MEMES/EBT_MEME_2.png',
];

interface MemeCardPreviewProps {
  onConnectClick?: () => void;
}

export function MemeCardPreview({ onConnectClick }: MemeCardPreviewProps) {
  const { authenticated, login } = usePrivy();
  const { address } = useAccount();

  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMeme, setShowMeme] = useState(false);

  // Cycle through static memes when not showing generated meme
  useEffect(() => {
    if (generatedMeme || isGenerating) return;

    const interval = setInterval(() => {
      setCurrentMemeIndex((prev) => (prev + 1) % STATIC_MEMES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [generatedMeme, isGenerating]);

  const handleGenerateMeme = async () => {
    if (!authenticated) {
      login();
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/memes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'public_meme',
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedMeme(data.imageUrl);
        setShowMeme(true);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch {
      setError('Failed to generate meme');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMeme = () => {
    if (!generatedMeme) return;
    const link = document.createElement('a');
    link.href = generatedMeme;
    link.download = `ebt-meme-${Date.now()}.png`;
    link.click();
  };

  const shareToTwitter = () => {
    const text = getRandomTweet('meme_share');
    const url = 'https://theebtprogram.com/memes';
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const currentBackgroundImage = generatedMeme || STATIC_MEMES[currentMemeIndex];

  return (
    <div className="relative mx-auto w-full max-w-2xl mb-12">
      <div className="bg-black/60 backdrop-blur-sm border border-ebt-gold/30 rounded-2xl p-2">
        {/* Card Container */}
        <div className="relative w-full aspect-[3/2] rounded-xl shadow-2xl overflow-hidden">
          {/* Background Meme Layer */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBackgroundImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img
                src={currentBackgroundImage}
                alt="Meme background"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
            </motion.div>
          </AnimatePresence>

          {/* Card Content Overlay */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-3xl md:text-4xl font-heading text-ebt-gold tracking-wider drop-shadow-lg">
                EBT CARD
              </h3>
              <p className="text-sm md:text-base font-sans text-gray-200 mt-1 drop-shadow-md">
                SUPPLEMENTAL NUTRITION ASSISTANCE
              </p>
            </div>

            {/* Chip and number */}
            <div className="flex items-end justify-between">
              <div>
                <div className="w-12 h-10 bg-gray-700/80 rounded mb-3" />
                <p className="font-mono text-white/90 text-lg tracking-wider drop-shadow-md">
                  XXXX XXXX XXXX 0420
                </p>
              </div>
              <p className="font-heading text-ebt-gold text-lg tracking-wide drop-shadow-lg">
                MEME MACHINE
              </p>
            </div>
          </div>

          {/* Loading Overlay */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-ebt-gold border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-ebt-gold font-heading text-xl">GENERATING...</p>
              <p className="text-gray-400 font-mono text-sm mt-2">This may take 5-15 seconds</p>
            </motion.div>
          )}
        </div>

        {/* Generate Button */}
        <div className="mt-3 flex gap-2">
          {generatedMeme ? (
            <>
              <button
                onClick={handleGenerateMeme}
                disabled={isGenerating}
                className="flex-1 py-3 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50"
              >
                REGENERATE
              </button>
              <button
                onClick={downloadMeme}
                className="px-4 py-3 bg-gray-800 text-white font-mono rounded-lg hover:bg-gray-700 transition-colors"
              >
                DL
              </button>
              <button
                onClick={shareToTwitter}
                className="px-4 py-3 bg-blue-600 text-white font-mono rounded-lg hover:bg-blue-500 transition-colors"
              >
                X
              </button>
            </>
          ) : (
            <button
              onClick={authenticated ? handleGenerateMeme : onConnectClick || login}
              disabled={isGenerating}
              className="w-full py-3 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  GENERATING...
                </span>
              ) : authenticated ? (
                'GENERATE YOUR MEME'
              ) : (
                'CONNECT TO GENERATE'
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-welfare-red font-mono text-sm mt-2 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Benefits Active badge */}
        <div className="absolute -top-3 -right-3 bg-welfare-red text-white px-3 py-1 rotate-12 font-heading text-sm tracking-wide">
          BENEFITS ACTIVE
        </div>
      </div>
    </div>
  );
}
