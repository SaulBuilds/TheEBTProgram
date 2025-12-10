'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface GalleryCardProps {
  id: number;
  imageUrl: string;
  generatedAt: string;
  onClick?: () => void;
  isNew?: boolean;
}

export function GalleryCard({ id, imageUrl, onClick, isNew }: GalleryCardProps) {
  // Handle both base64 and URL images
  const imgSrc = imageUrl.startsWith('data:')
    ? imageUrl
    : `/api/memes/image/${id}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: isNew ? 0.8 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: isNew ? 0.5 : 0.3,
        type: isNew ? 'spring' : 'tween',
        bounce: isNew ? 0.4 : 0,
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-2 cursor-pointer hover:border-ebt-gold/50 transition-colors overflow-hidden"
    >
      <div className="relative aspect-square">
        <Image
          src={imgSrc}
          alt="Community meme"
          fill
          className="rounded-lg object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={imageUrl.startsWith('data:')}
        />
        {isNew && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute top-2 right-2 px-2 py-1 bg-ebt-gold text-black text-xs font-mono rounded"
          >
            NEW
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
