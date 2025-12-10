'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getRandomTweet } from '@/lib/tweet-generator';

interface SharePageClientProps {
  memeId: number;
  imageUrl: string;
}

export default function SharePageClient({ memeId, imageUrl }: SharePageClientProps) {
  const router = useRouter();
  const shareUrl = `https://web3welfare.com/share/${memeId}`;

  const handleTwitterShare = () => {
    const text = getRandomTweet('meme_share');
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ebt-meme-${memeId}.png`;
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <h1 className="text-3xl font-heading text-ebt-gold text-center mb-6 tracking-wide">
          EBT MEME
        </h1>

        {/* Meme Image */}
        <div className="bg-black/60 backdrop-blur-sm border border-ebt-gold/30 rounded-xl p-2 mb-6">
          <img
            src={imageUrl}
            alt="EBT Meme"
            className="w-full rounded-lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleTwitterShare}
            className="w-full py-4 bg-blue-500 text-white font-heading tracking-wide rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            Share on Twitter
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-ebt-gold text-black font-heading tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors"
            >
              Download
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 bg-gray-800 text-white font-heading tracking-wide rounded-lg hover:bg-gray-700 transition-colors"
            >
              Copy Link
            </button>
          </div>

          <button
            onClick={() => router.push('/memes')}
            className="w-full py-3 bg-transparent border border-gray-700 text-gray-400 font-mono rounded-lg hover:border-gray-500 transition-colors"
          >
            Make Your Own Meme
          </button>
        </div>

        {/* Branding */}
        <p className="text-center text-gray-500 font-mono text-sm mt-8">
          Made with the EBT Meme Machine
        </p>
        <p className="text-center text-gray-600 font-mono text-xs mt-2">
          web3welfare.com
        </p>
      </motion.div>
    </div>
  );
}
