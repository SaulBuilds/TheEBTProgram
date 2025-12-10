'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface MemeUploaderProps {
  onImageSelect: (base64: string) => void;
  currentImage: string | null;
  onClear: () => void;
}

const MAX_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function MemeUploader({ onImageSelect, currentImage, onClear }: MemeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = useCallback((file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, JPG, or WebP image');
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('Image must be under 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  }, [validateAndProcessFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  }, [validateAndProcessFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (currentImage) {
    return (
      <div className="relative">
        <img
          src={currentImage}
          alt="Upload preview"
          className="w-full rounded-lg border border-ebt-gold/30"
        />
        <button
          onClick={onClear}
          className="absolute top-2 right-2 w-8 h-8 bg-black/80 border border-welfare-red/50 rounded-full flex items-center justify-center text-welfare-red hover:bg-welfare-red hover:text-white transition-colors"
          aria-label="Remove image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <p className="text-xs text-gray-500 font-mono mt-2 text-center">
          Image uploaded - add a prompt to remix it
        </p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        animate={{
          borderColor: isDragging ? 'rgb(255, 215, 0)' : 'rgba(255, 215, 0, 0.2)',
          backgroundColor: isDragging ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
        }}
        className="border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ scale: isDragging ? 1.1 : 1 }}
            className="w-12 h-12 mb-4 text-ebt-gold/50"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </motion.div>

          <p className="text-gray-400 font-mono text-sm mb-1">
            {isDragging ? 'Drop image here' : 'Drag & drop an image'}
          </p>
          <p className="text-gray-600 font-mono text-xs">
            or click to browse
          </p>
          <p className="text-gray-700 font-mono text-xs mt-2">
            PNG, JPG, WebP - Max 4MB
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-welfare-red font-mono text-sm mt-2"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
