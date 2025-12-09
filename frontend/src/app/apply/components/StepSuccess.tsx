'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Confetti from 'react-confetti';
import type { ApplicationData } from '../ApplyContent';
import { ShareModal } from './ShareModal';

interface StepSuccessProps {
  data: ApplicationData;
  achievements: string[];
}

const STORAGE_KEY = 'ebt_application_state';

export function StepSuccess({ data, achievements }: StepSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    // Clear the session storage on success
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }

    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (showModal) {
    return <ShareModal data={data} onClose={() => setShowModal(false)} />;
  }

  return (
    <div className="max-w-md mx-auto text-center">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#D4AF37', '#8B0000', '#FFD700', '#FF6B6B']}
        />
      )}

      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-8"
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-ebt-gold to-welfare-red rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-mono font-bold text-ebt-gold mb-4"
      >
        Application Submitted!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-gray-400 font-mono mb-8"
      >
        Your application is now in the queue. We&apos;ll analyze your wallet and generate your unique EBT card.
      </motion.p>

      {/* Status Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full mb-8"
      >
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
        <span className="text-sm font-mono text-yellow-500">Pending Review</span>
      </motion.div>

      {/* Achievement Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h3 className="text-sm font-mono text-gray-500 mb-3">ACHIEVEMENTS UNLOCKED</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="px-3 py-1 bg-ebt-gold/20 border border-ebt-gold/30 rounded-full"
            >
              <span className="text-sm font-mono text-ebt-gold">{achievement}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Application Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-4 bg-gray-900 border border-gray-800 rounded-lg mb-8 text-left"
      >
        <h3 className="font-mono font-bold text-white mb-3">Application Details</h3>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">Username</span>
            <span className="text-white">{data.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">User ID</span>
            <span className="text-white font-mono">{data.userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="text-yellow-500">Pending</span>
          </div>
        </div>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-4 bg-ebt-gold/10 border border-ebt-gold/30 rounded-lg mb-8 text-left"
      >
        <h3 className="font-mono font-bold text-ebt-gold mb-2">What Happens Next?</h3>
        <ul className="text-sm font-mono text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">1.</span>
            <span>We analyze your wallet for NFT and token holdings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">2.</span>
            <span>Your final score is calculated based on all factors</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">3.</span>
            <span>A unique EBT card is generated just for you</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-ebt-gold">4.</span>
            <span>Once approved, you&apos;ll be able to mint your NFT</span>
          </li>
        </ul>
      </motion.div>

      {/* Timeline Estimate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg mb-8"
      >
        <p className="text-sm font-mono text-gray-500">
          Applications are typically reviewed within 24-48 hours.
          Check your profile page for status updates.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col gap-3"
      >
        <Link
          href={`/profile/${data.userId}`}
          className="w-full py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors text-center"
        >
          View Your Profile
        </Link>
      </motion.div>
    </div>
  );
}
