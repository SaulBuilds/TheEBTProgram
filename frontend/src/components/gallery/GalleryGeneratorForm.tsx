'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { MemeUploader } from './MemeUploader';
import { ASPECT_RATIOS, STYLE_INTENSITIES, AspectRatio, StyleIntensity } from '@/lib/meme-generator';

interface MemeInfo {
  remaining: number;
  dailyLimit: number;
  resetAt: string;
}

interface GeneratedMeme {
  id: number;
  imageUrl: string;
  generatedAt: string;
}

interface GalleryGeneratorFormProps {
  onGenerated: (meme: GeneratedMeme) => void;
  memeInfo: MemeInfo | null;
  onMemeInfoUpdate: (info: MemeInfo) => void;
}

export function GalleryGeneratorForm({
  onGenerated,
  memeInfo,
  onMemeInfoUpdate,
}: GalleryGeneratorFormProps) {
  const { address } = useAccount();

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [styleIntensity, setStyleIntensity] = useState<StyleIntensity>(3);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleImageSelect = (base64: string) => {
    setUploadedImage(base64);
    setError(null);
  };

  const handleClearImage = () => {
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    if (memeInfo && memeInfo.remaining <= 0) {
      setError('Daily limit reached! Come back tomorrow.');
      return;
    }

    if (!textPrompt.trim() && !uploadedImage) {
      setError('Please enter a prompt or upload an image');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/memes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'public_meme',
          userInput: textPrompt || undefined,
          baseImage: uploadedImage || undefined,
          walletAddress: address,
          aspectRatio,
          styleIntensity,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onGenerated({
          id: data.generationId,
          imageUrl: data.imageUrl,
          generatedAt: new Date().toISOString(),
        });

        // Clear form
        setTextPrompt('');
        setUploadedImage(null);

        // Update rate limit info
        if (data.remaining !== undefined && memeInfo) {
          onMemeInfoUpdate({
            ...memeInfo,
            remaining: data.remaining,
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

  return (
    <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6">
      <h2 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">
        CREATE A MEME
      </h2>

      {/* Rate limit indicator */}
      {memeInfo && (
        <div className="mb-4 flex items-center justify-between text-sm font-mono">
          <span className="text-gray-500">Daily generations:</span>
          <span className={memeInfo.remaining > 0 ? 'text-ebt-gold' : 'text-welfare-red'}>
            {memeInfo.remaining} / {memeInfo.dailyLimit}
          </span>
        </div>
      )}

      {/* Image uploader */}
      <div className="mb-4">
        <label className="block text-sm font-mono text-gray-400 mb-2">
          Upload an image (optional):
        </label>
        <MemeUploader
          onImageSelect={handleImageSelect}
          currentImage={uploadedImage}
          onClear={handleClearImage}
        />
      </div>

      {/* Text prompt */}
      <div className="mb-4">
        <label className="block text-sm font-mono text-gray-400 mb-2">
          {uploadedImage ? 'Describe how to remix it:' : 'Describe your meme:'}
        </label>
        <textarea
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder={
            uploadedImage
              ? 'e.g., Add Pepe looking at this with a smug expression'
              : 'e.g., Wojak explaining tokenomics at the food bank'
          }
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ebt-gold resize-none"
          rows={3}
        />
      </div>

      {/* Advanced options toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm font-mono text-gray-500 hover:text-gray-400 mb-4 flex items-center gap-2"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Advanced options
      </button>

      {/* Advanced options */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Aspect Ratio */}
            <div className="mb-4">
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Aspect Ratio:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(ASPECT_RATIOS) as [AspectRatio, typeof ASPECT_RATIOS['1:1']][]).map(
                  ([ratio, info]) => (
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
                  )
                )}
              </div>
            </div>

            {/* Style Intensity */}
            <div className="mb-4">
              <label className="block text-sm font-mono text-gray-400 mb-2">
                Glitch Intensity:{' '}
                <span className="text-ebt-gold">{STYLE_INTENSITIES[styleIntensity].label}</span>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-welfare-red/10 border border-welfare-red/30 rounded-lg"
          >
            <p className="text-welfare-red font-mono text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || (memeInfo !== null && memeInfo.remaining <= 0)}
        className="w-full py-4 bg-ebt-gold text-black font-heading text-xl tracking-wide rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
