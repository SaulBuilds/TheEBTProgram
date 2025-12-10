'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { LightboxModal } from '@/components/gallery/LightboxModal';

interface MemeItem {
  id: number;
  imageUrl: string;
  generatedAt: string;
}

export function MemeGallery() {
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState<MemeItem | null>(null);

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const response = await fetch('/api/memes/gallery?limit=9&random=true');
        if (response.ok) {
          const data = await response.json();
          setMemes(data.memes);
        }
      } catch (error) {
        console.error('Failed to fetch gallery memes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemes();
  }, []);

  // Don't render section if no memes
  if (!loading && memes.length === 0) {
    return null;
  }

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide"
          >
            COMMUNITY MEMES
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400"
          >
            Propaganda from the people. By the people. For the algorithm.
          </motion.p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-black/80 border border-ebt-gold/10 rounded-xl p-2 animate-pulse"
              >
                <div className="aspect-square bg-gray-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memes.map((meme, index) => (
              <motion.div
                key={meme.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GalleryCard
                  id={meme.id}
                  imageUrl={meme.imageUrl}
                  generatedAt={meme.generatedAt}
                  onClick={() => setSelectedMeme(meme)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            href="/gallery"
            className="inline-block px-8 py-4 bg-ebt-gold text-black font-heading text-xl tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors"
          >
            VIEW FULL GALLERY
          </Link>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={selectedMeme !== null}
        onClose={() => setSelectedMeme(null)}
        meme={selectedMeme}
      />
    </section>
  );
}
