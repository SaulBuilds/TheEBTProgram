'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Frame animation configurations
export const FRAME_ANIMATIONS = {
  pepeClimbing: {
    basePath: '/cardAttachements/pepe_climbing_over/pepe_climb',
    frameCount: 9,
    extension: '.png',
  },
} as const;

export type FrameAnimationKey = keyof typeof FRAME_ANIMATIONS;

interface ScrollFrameCharacterProps {
  animation: FrameAnimationKey;
  // Size as percentage of parent width
  size?: number;
  // Position offsets (percentage-based)
  offsetX?: number;
  offsetY?: number;
  // Z-index for layering
  zIndex?: number;
  // Flip horizontally
  flipX?: boolean;
  // Custom class
  className?: string;
  // Scroll trigger settings
  scrollStart?: string; // e.g., 'top 80%'
  scrollEnd?: string; // e.g., 'bottom 20%'
}

export function ScrollFrameCharacter({
  animation,
  size = 35,
  offsetX = 0,
  offsetY = 0,
  zIndex = 20,
  flipX = false,
  className = '',
  scrollStart = 'top 90%',
  scrollEnd = 'top 30%',
}: ScrollFrameCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(1);
  const frameRef = useRef(1);
  const animConfig = FRAME_ANIMATIONS[animation];

  // Preload all frames
  useEffect(() => {
    const preloadImages: HTMLImageElement[] = [];
    for (let i = 1; i <= animConfig.frameCount; i++) {
      const img = new window.Image();
      img.src = `${animConfig.basePath}${i}${animConfig.extension}`;
      preloadImages.push(img);
    }
  }, [animConfig]);

  // Set up GSAP ScrollTrigger for frame animation
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const parentCard = container.closest('.group') || container.parentElement;

    if (!parentCard) return;

    // Create scroll trigger that updates frame based on scroll progress
    const scrollTrigger = ScrollTrigger.create({
      trigger: parentCard,
      start: scrollStart,
      end: scrollEnd,
      scrub: 0.5,
      onUpdate: (self) => {
        // Map scroll progress (0-1) to frame number (1-9)
        const progress = self.progress;
        const newFrame = Math.min(
          Math.max(1, Math.ceil(progress * animConfig.frameCount)),
          animConfig.frameCount
        );

        if (newFrame !== frameRef.current) {
          frameRef.current = newFrame;
          setCurrentFrame(newFrame);
        }
      },
    });

    return () => {
      scrollTrigger.kill();
    };
  }, [animConfig.frameCount, scrollStart, scrollEnd]);

  // Get current frame path
  const currentFramePath = `${animConfig.basePath}${currentFrame}${animConfig.extension}`;

  // Position styles - same as CardCharacter corner-top-right
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: `${offsetX}%`,
    width: `${size}%`,
    zIndex,
    pointerEvents: 'none',
    transform: `translate(30%, ${-70 + offsetY}%) ${flipX ? 'scaleX(-1)' : ''}`,
  };

  return (
    <div
      ref={containerRef}
      className={`select-none ${className}`}
      style={positionStyles}
    >
      {/* Render all frames, only show current one */}
      {Array.from({ length: animConfig.frameCount }, (_, i) => i + 1).map((frameNum) => (
        <Image
          key={frameNum}
          src={`${animConfig.basePath}${frameNum}${animConfig.extension}`}
          alt=""
          width={400}
          height={400}
          className="w-full h-auto object-contain"
          style={{
            display: frameNum === currentFrame ? 'block' : 'none',
          }}
          priority={frameNum <= 3} // Prioritize first few frames
        />
      ))}
    </div>
  );
}
