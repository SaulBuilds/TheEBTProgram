'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomTweet } from '@/lib/tweet-generator';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  meme: {
    id: number;
    imageUrl: string;
    generatedAt: string;
  } | null;
}

export function LightboxModal({ isOpen, onClose, meme }: LightboxModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!meme) return null;

  const shareUrl = `https://web3welfare.com/share/${meme.id}`;
  const imgSrc = meme.imageUrl.startsWith('data:')
    ? meme.imageUrl
    : `/api/memes/image/${meme.id}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `ebt-meme-${meme.id}.png`;
    link.click();
  };

  const handleShare = () => {
    const text = getRandomTweet('meme_share');
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.2 }}
            className="relative max-w-4xl w-full bg-black/80 border border-ebt-gold/30 rounded-xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-black border border-ebt-gold/50 rounded-full flex items-center justify-center text-ebt-gold hover:bg-ebt-gold hover:text-black transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative">
              <img
                src={imgSrc}
                alt="Meme"
                className="w-full rounded-lg"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleDownload}
                className="flex-1 min-w-[120px] py-3 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={handleShare}
                className="flex-1 min-w-[120px] py-3 bg-blue-500 text-white font-mono font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 min-w-[120px] py-3 bg-gray-800 text-white font-mono font-bold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>
            </div>

            {/* Date */}
            <p className="text-center text-gray-500 font-mono text-xs mt-4">
              Created {new Date(meme.generatedAt).toLocaleDateString()}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
