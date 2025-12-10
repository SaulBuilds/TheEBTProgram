'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GalleryCard } from './GalleryCard';
import { MemeItem } from '@/lib/hooks/useGallery';

interface GalleryGridProps {
  memes: MemeItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onMemeClick: (selectedMeme: MemeItem) => void;
}

export function GalleryGrid({
  memes,
  loading,
  hasMore,
  onLoadMore,
  onMemeClick,
}: GalleryGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (memes.length === 0 && !loading) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎨</div>
        <p className="text-gray-400 font-mono">No memes yet. Be the first to create one!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {memes.map((meme, index) => (
          <motion.div
            key={meme.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5) }}
          >
            <GalleryCard
              id={meme.id}
              imageUrl={meme.imageUrl}
              generatedAt={meme.generatedAt}
              isNew={meme.isNew}
              onClick={() => onMemeClick(meme)}
            />
          </motion.div>
        ))}

        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-black/80 border border-ebt-gold/10 rounded-xl p-2 animate-pulse"
            >
              <div className="aspect-square bg-gray-800 rounded-lg" />
            </div>
          ))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-10 mt-4" />

      {/* Load more button fallback */}
      {hasMore && !loading && (
        <div className="text-center mt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-gray-800 text-gray-400 font-mono text-sm rounded-lg hover:bg-gray-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {/* End of gallery message */}
      {!hasMore && memes.length > 0 && (
        <p className="text-center text-gray-600 font-mono text-sm mt-8">
          You&apos;ve reached the end of the gallery
        </p>
      )}
    </div>
  );
}
