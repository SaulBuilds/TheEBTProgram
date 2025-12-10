'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ApplicationData } from '../ApplyContent';
import { getRandomTweet } from '@/lib/tweet-generator';

interface ShareModalProps {
  data: ApplicationData;
  onClose: () => void;
}

export function ShareModal({ data, onClose }: ShareModalProps) {
  const [memeUrl, setMemeUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateMeme = async () => {
      try {
        const response = await fetch('/api/memes/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'application_fomo',
            userInput: data.username ? `The applicant's username is "${data.username}"` : undefined,
            walletAddress: data.lockedWalletAddress,
            userId: data.userId,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success && result.imageUrl) {
          setMemeUrl(result.imageUrl);
        } else {
          console.error('Meme generation failed:', result.error || result.message);
          setError(result.error || 'Generation failed');
          // Fallback to a default meme
          setMemeUrl('/EBT_MEMES/we accept ebt.jpeg');
        }
      } catch (err) {
        console.error('Error generating meme:', err);
        setError('Network error');
        // Fallback to a default meme
        setMemeUrl('/EBT_MEMES/we accept ebt.jpeg');
      } finally {
        setLoading(false);
      }
    };

    generateMeme();
  }, [data.username, data.lockedWalletAddress, data.userId]);

  const referralLink = `https://web3welfare.com/apply?ref=${data.userId}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full text-center">
        <h2 className="text-3xl font-mono font-bold text-ebt-gold mb-4">Share Your Application!</h2>
        <p className="text-gray-400 font-mono mb-8">
          Share your referral link and this meme to get a bonus on your first stipend.
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-4 border-ebt-gold border-t-transparent rounded-full animate-spin" />
            <div className="text-ebt-gold font-mono">Generating your meme...</div>
            <div className="text-gray-500 font-mono text-sm">This may take 5-15 seconds</div>
          </div>
        ) : (
          <div className="relative">
            <img src={memeUrl} alt="Generated Meme" className="w-full h-auto rounded-lg mb-4" />
            {error && (
              <div className="text-yellow-500 font-mono text-sm mb-4">
                Using fallback image (generation temporarily unavailable)
              </div>
            )}
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = memeUrl;
                link.download = `ebt-meme-${Date.now()}.png`;
                link.click();
              }}
              className="w-full py-2 bg-gray-800 text-gray-300 font-mono text-sm rounded-lg hover:bg-gray-700 transition-colors mb-4"
            >
              Download Meme
            </button>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded-lg mb-8">
          <p className="text-gray-400 font-mono text-sm mb-2">Your referral link:</p>
          <input
            type="text"
            readOnly
            value={referralLink}
            className="w-full bg-gray-900 text-white font-mono p-2 rounded-lg border border-gray-700"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              const tweetText = getRandomTweet('application');
              const text = `${tweetText}\n\n${referralLink}`;
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
                '_blank'
              );
            }}
            className="w-full py-4 bg-blue-500 text-white font-mono font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Share on Twitter
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-700 text-white font-mono font-bold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}
