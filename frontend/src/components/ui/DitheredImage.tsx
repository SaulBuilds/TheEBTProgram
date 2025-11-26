'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface DitheredImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  ditherIntensity?: number;
}

export function DitheredImage({
  src,
  alt,
  width,
  height,
  className = '',
  ditherIntensity = 0.8
}: DitheredImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = imageRef.current;

    const applyDithering = () => {
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Floyd-Steinberg dithering
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          // Convert to grayscale (optional, remove for color dithering)
          const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

          // Apply threshold
          const newVal = gray > 128 ? 255 : 0;
          const error = (gray - newVal) * ditherIntensity;

          // Apply the new value
          data[idx] = newVal;
          data[idx + 1] = newVal;
          data[idx + 2] = newVal;

          // Distribute error to neighboring pixels
          if (x + 1 < width) {
            const rightIdx = idx + 4;
            data[rightIdx] += error * 7 / 16;
            data[rightIdx + 1] += error * 7 / 16;
            data[rightIdx + 2] += error * 7 / 16;
          }

          if (y + 1 < height) {
            if (x > 0) {
              const bottomLeftIdx = ((y + 1) * width + (x - 1)) * 4;
              data[bottomLeftIdx] += error * 3 / 16;
              data[bottomLeftIdx + 1] += error * 3 / 16;
              data[bottomLeftIdx + 2] += error * 3 / 16;
            }

            const bottomIdx = ((y + 1) * width + x) * 4;
            data[bottomIdx] += error * 5 / 16;
            data[bottomIdx + 1] += error * 5 / 16;
            data[bottomIdx + 2] += error * 5 / 16;

            if (x + 1 < width) {
              const bottomRightIdx = ((y + 1) * width + (x + 1)) * 4;
              data[bottomRightIdx] += error * 1 / 16;
              data[bottomRightIdx + 1] += error * 1 / 16;
              data[bottomRightIdx + 2] += error * 1 / 16;
            }
          }
        }
      }

      // Add some gold tinting
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 128) {
          data[i] = 255;      // Red
          data[i + 1] = 215;  // Green
          data[i + 2] = 0;    // Blue (gold color)
        }
      }

      // Put the dithered image back
      ctx.putImageData(imageData, 0, 0);
    };

    if (img.complete) {
      applyDithering();
    } else {
      img.onload = applyDithering;
    }
  }, [src, width, height, ditherIntensity]);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden image for loading */}
      <Image
        ref={imageRef as any}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="hidden"
        priority
      />

      {/* Canvas for dithered output */}
      <canvas
        ref={canvasRef}
        className="w-full h-auto dither"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Glitch overlay effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ebt-gold/5 to-transparent animate-scan" />
      </div>
    </div>
  );
}