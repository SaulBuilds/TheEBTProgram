'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { DitheredVideoBackground } from '@/components/ui/DitheredVideoBackground';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { ASPECT_RATIOS, STYLE_INTENSITIES, AspectRatio, StyleIntensity } from '@/lib/meme-generator';
import { getRandomTweet } from '@/lib/tweet-generator';

interface MemeInfo {
  topics: string[];
  dailyLimit: number;
  remaining: number;
  resetAt: string;
}

export default function MemeGeneratorContent() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();

  const [memeInfo, setMemeInfo] = useState<MemeInfo | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentMemes, setRecentMemes] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [styleIntensity, setStyleIntensity] = useState<StyleIntensity>(3);

  const fetchMemeInfo = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (address) params.set('walletAddress', address);

      const response = await fetch(`/api/memes/generate?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMemeInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch meme info:', err);
    }
  }, [address]);

  // Fetch meme info on load
  useEffect(() => {
    fetchMemeInfo();
  }, [fetchMemeInfo]);

  const generateMeme = async () => {
    if (memeInfo && memeInfo.remaining <= 0) {
      setError('Daily limit reached! Come back tomorrow for more free generations.');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const topic = customTopic || selectedTopic;

      const response = await fetch('/api/memes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'public_meme',
          userInput: topic || undefined,
          walletAddress: address,
          aspectRatio,
          styleIntensity,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedImage(data.imageUrl);
        setRecentMemes((prev) => [data.imageUrl, ...prev].slice(0, 6));

        // Update remaining count
        if (memeInfo) {
          setMemeInfo({
            ...memeInfo,
            remaining: data.remaining ?? memeInfo.remaining - 1,
          });
        }
      } else {
        setError(data.error || data.message || 'Generation failed');
      }
    } catch {
      setError('Failed to generate meme. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadMeme = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ebt-meme-${Date.now()}.png`;
    link.click();
  };

  const shareMeme = async () => {
    if (!generatedImage) return;

    if (navigator.share) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], 'ebt-meme.png', { type: 'image/png' });

        await navigator.share({
          title: 'EBT Meme',
          text: 'Check out this meme from The EBT Program!',
          files: [file],
        });
      } catch {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText('Check out The EBT Program: https://theebtprogram.com');
      }
    } else {
      const tweetText = getRandomTweet('meme_share');
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://theebtprogram.com/memes')}`,
        '_blank'
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <DitheredVideoBackground videoSrc="/backgrounds/Fridge_Animation_Corrections_Provided.mp4" />
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            MEME MACHINE
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Generate EBT-style memes for free. 10 per day. No account required.
            The propaganda department thanks you for your service.
          </p>
        </motion.div>

        {/* Usage Counter */}
        {memeInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-mono">Daily Generations</p>
                <p className="text-2xl font-heading text-ebt-gold">
                  {memeInfo.remaining} / {memeInfo.dailyLimit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-mono">Resets</p>
                <p className="text-sm text-gray-400">
                  {new Date(memeInfo.resetAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ebt-gold to-welfare-red transition-all"
                style={{ width: `${(memeInfo.remaining / memeInfo.dailyLimit) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Topic Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl"
        >
          <h2 className="text-xl font-heading text-white mb-4 tracking-wide">
            CHOOSE YOUR TOPIC
          </h2>

          {/* Preset Topics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {memeInfo?.topics.slice(0, 9).map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic);
                  setCustomTopic('');
                }}
                className={`p-3 text-sm font-mono rounded-lg transition-all ${
                  selectedTopic === topic
                    ? 'bg-ebt-gold text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Custom Topic */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              Or enter your own topic:
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                setSelectedTopic('');
              }}
              placeholder="e.g., Pepe explaining blockchain to boomers"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ebt-gold"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="mt-6">
            <label className="block text-sm font-mono text-gray-400 mb-3">
              Aspect Ratio:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS['1:1']][]).map(([ratio, info]) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`p-2 text-xs font-mono rounded-lg transition-all ${
                    aspectRatio === ratio
                      ? 'bg-ebt-gold text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  title={info.description}
                >
                  {ratio}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {ASPECT_RATIOS[aspectRatio].description}
            </p>
          </div>

          {/* Style Intensity Slider */}
          <div className="mt-6">
            <label className="block text-sm font-mono text-gray-400 mb-3">
              Glitch Intensity: <span className="text-ebt-gold">{STYLE_INTENSITIES[styleIntensity].label}</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={styleIntensity}
              onChange={(e) => setStyleIntensity(parseInt(e.target.value) as StyleIntensity)}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-ebt-gold"
            />
            <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
              <span>Clean</span>
              <span>Chaos</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {STYLE_INTENSITIES[styleIntensity].description}
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateMeme}
            disabled={generating || (memeInfo !== null && memeInfo.remaining <= 0)}
            className="mt-6 w-full py-4 bg-ebt-gold text-black font-heading text-xl tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                GENERATING...
              </span>
            ) : memeInfo && memeInfo.remaining <= 0 ? (
              'DAILY LIMIT REACHED'
            ) : (
              'GENERATE MEME'
            )}
          </button>

          {/* Random Topic Button */}
          <button
            onClick={() => {
              if (memeInfo?.topics) {
                const random = memeInfo.topics[Math.floor(Math.random() * memeInfo.topics.length)];
                setSelectedTopic(random);
                setCustomTopic('');
              }
            }}
            className="mt-3 w-full py-2 bg-gray-800 text-gray-400 font-mono text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            🎲 Random Topic
          </button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-xl"
            >
              <p className="text-welfare-red font-mono">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Image */}
        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl"
            >
              <h2 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
                YOUR MEME IS READY
              </h2>

              <img
                src={generatedImage}
                alt="Generated meme"
                className="w-full rounded-lg mb-6"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadMeme}
                  className="flex-1 py-3 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90"
                >
                  📥 Download
                </button>
                <button
                  onClick={shareMeme}
                  className="flex-1 py-3 bg-blue-600 text-white font-mono font-bold rounded-lg hover:bg-blue-500"
                >
                  🐦 Share
                </button>
                <button
                  onClick={() => setGeneratedImage(null)}
                  className="px-6 py-3 bg-gray-800 text-gray-400 font-mono rounded-lg hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Memes */}
        {recentMemes.length > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-6 bg-black/80 backdrop-blur-sm border border-gray-800 rounded-xl"
          >
            <h2 className="text-lg font-heading text-gray-400 mb-4 tracking-wide">
              SESSION HISTORY
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {recentMemes.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Recent meme ${i + 1}`}
                  className="w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setGeneratedImage(img)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-black/60 backdrop-blur-sm border border-gray-800 rounded-xl"
        >
          <h2 className="text-lg font-heading text-white mb-4 tracking-wide">
            ABOUT THE MEME MACHINE
          </h2>
          <div className="space-y-3 text-sm text-gray-400 font-mono">
            <p>
              🎨 <strong>Style:</strong> Mixed media collage blending 1980s Kodak film photography
              with classic internet meme characters (Pepe, Wojak, Doge).
            </p>
            <p>
              🔧 <strong>Tech:</strong> Powered by Gemini AI with custom prompts tuned for
              maximum memetic potential.
            </p>
            <p>
              📊 <strong>Limits:</strong> 10 free generations per day. Rate limits reset at midnight.
              {authenticated && ' Connect your wallet for personalized tracking.'}
            </p>
            <p>
              ⚠️ <strong>Disclaimer:</strong> These memes are satirical art. The EBT Program is not
              affiliated with any government agency. We are barely a functional protocol.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
