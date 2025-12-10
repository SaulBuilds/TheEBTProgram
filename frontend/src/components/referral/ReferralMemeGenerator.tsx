'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReferralMemeGeneratorProps {
  userId?: string;
  walletAddress?: string;
  twitterAvatar?: string;
  referralCode?: string;
}

export function ReferralMemeGenerator({
  userId,
  walletAddress,
  twitterAvatar,
  referralCode,
}: ReferralMemeGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateMeme = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/memes/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twitterAvatar,
          referralCode,
          userId,
          walletAddress,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedImage(data.imageUrl);
      } else {
        setError(data.error || 'Generation failed');
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
    link.download = `ebt-referral-${Date.now()}.png`;
    link.click();
  };

  const shareToTwitter = () => {
    const referralUrl = referralCode
      ? `https://web3welfare.com/?ref=${referralCode}`
      : 'https://web3welfare.com';

    const tweetText = encodeURIComponent(
      `I'm on The EBT Program. Join the blockchain breadline, anon. 🍞\n\n${referralUrl}`
    );

    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  return (
    <div className="p-6 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading text-ebt-gold tracking-wide">
            REFERRAL MEME GENERATOR
          </h3>
          <p className="text-sm text-gray-500 font-mono">
            Create a personalized FOMO meme to share
          </p>
        </div>
        {twitterAvatar && (
          <img
            src={twitterAvatar}
            alt="Your avatar"
            className="w-10 h-10 rounded-full border-2 border-ebt-gold"
          />
        )}
      </div>

      {/* Info Box */}
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400 font-mono">
          {twitterAvatar
            ? '✓ Your Twitter avatar will be included in the meme'
            : '💡 Connect Twitter to include your avatar in the meme'}
        </p>
      </div>

      {/* Generate Button */}
      {!generatedImage && (
        <button
          onClick={generateMeme}
          disabled={generating}
          className="w-full py-3 bg-ebt-gold text-black font-heading text-lg tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              GENERATING...
            </span>
          ) : (
            'GENERATE REFERRAL MEME'
          )}
        </button>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 bg-welfare-red/10 border border-welfare-red/30 rounded-lg"
          >
            <p className="text-sm text-welfare-red font-mono">{error}</p>
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
            className="mt-4"
          >
            <img
              src={generatedImage}
              alt="Your referral meme"
              className="w-full rounded-lg mb-4"
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={downloadMeme}
                className="py-2 bg-gray-800 text-white font-mono text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                📥 Save
              </button>
              <button
                onClick={shareToTwitter}
                className="py-2 bg-blue-600 text-white font-mono text-sm rounded-lg hover:bg-blue-500 transition-colors"
              >
                🐦 Tweet
              </button>
              <button
                onClick={() => {
                  setGeneratedImage(null);
                  generateMeme();
                }}
                disabled={generating}
                className="py-2 bg-ebt-gold text-black font-mono text-sm rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50"
              >
                🔄 New
              </button>
            </div>

            {/* Referral Link */}
            {referralCode && (
              <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-500 font-mono mb-1">Your referral link:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://web3welfare.com/?ref=${referralCode}`}
                    className="flex-1 px-3 py-2 bg-black border border-gray-800 rounded font-mono text-xs text-gray-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://web3welfare.com/?ref=${referralCode}`
                      );
                    }}
                    className="px-3 py-2 bg-gray-800 text-gray-400 font-mono text-xs rounded hover:bg-gray-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ironic Disclaimer */}
      <p className="mt-4 text-xs text-gray-600 font-mono italic text-center">
        &ldquo;Referral links are a joke in Web3, but at least ours come with art.&rdquo;
      </p>
    </div>
  );
}
