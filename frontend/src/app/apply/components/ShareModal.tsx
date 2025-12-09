'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ApplicationData } from '../ApplyContent';

interface ShareModalProps {
  data: ApplicationData;
  onClose: () => void;
}

export function ShareModal({ data, onClose }: ShareModalProps) {
  const [memeUrl, setMemeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the meme from the "nano banana api"
    const generateMeme = async () => {
      try {
        // I'll need to get the actual API endpoint and prompt from the user
        const response = await fetch('https://api.nanobanana.com/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `A meme about applying for foodstamps. Include the username ${data.username}.`,
          }),
        });
        const result = await response.json();
        setMemeUrl(result.url);
      } catch (error) {
        console.error('Error generating meme:', error);
        // Fallback to a default meme
        setMemeUrl('/EBT_MEMES/we accept ebt.jpeg');
      } finally {
        setLoading(false);
      }
    };

    generateMeme();
  }, [data.username]);

  const referralLink = `https://ebtcard.io/apply?ref=${data.userId}`;

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
          <div className="animate-pulse text-ebt-gold font-mono">Generating your meme...</div>
        ) : (
          <img src={memeUrl} alt="Generated Meme" className="w-full h-auto rounded-lg mb-8" />
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
              const text = `I just applied for my EBT card on the blockchain!\n\n${referralLink}\n\n#EBTCard #DeFi #Breadline`;
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
