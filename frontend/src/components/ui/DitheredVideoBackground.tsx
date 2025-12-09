'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

interface DitheredVideoBackgroundProps {
  videoSrc?: string;
  className?: string;
  fixed?: boolean;
}

// Detect mobile/touch devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function DitheredVideoBackground({
  videoSrc = '/ebt-video.mp4',
  className = '',
  fixed = true,
}: DitheredVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [mousePos, setMousePos] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0.5,
    normalizedY: 0.5,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  // Handle mouse movement for interactive effects (desktop only)
  useEffect(() => {
    // Skip mouse effects on mobile
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
        normalizedX: e.clientX / window.innerWidth,
        normalizedY: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Handle video load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
      setIsLoaded(true);
    };

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);

    // Check if already loaded
    if (video.readyState >= 2) {
      setVideoDuration(video.duration);
      setIsLoaded(true);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Set up GSAP ScrollTrigger for video scrubbing (desktop) or autoplay (mobile)
  useEffect(() => {
    if (!isLoaded || !videoDuration || typeof window === 'undefined') return;

    const video = videoRef.current;
    if (!video) return;

    // On mobile: simple autoplay loop
    if (isMobile) {
      video.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
      return;
    }

    // On desktop: scroll-controlled video
    // Create a scroll timeline that controls video playback
    // Slower scrubbing - video plays at 1/3 speed relative to scroll
    const scrollTrigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2, // Smooth scrubbing with 2s delay for slower feel
      onUpdate: (self) => {
        // Map scroll progress to video time - use only 1/3 of video for slower playback
        const targetTime = (self.progress * videoDuration) / 3;
        // Only update if the difference is significant
        if (Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
      },
    });

    // Pause the video - we control playback via scroll
    video.pause();

    return () => {
      scrollTrigger.kill();
    };
  }, [isLoaded, videoDuration, isMobile]);

  // Calculate CSS filter values based on mouse position (simplified on mobile)
  const getFilterStyles = useCallback(() => {
    // On mobile, use fixed filter values for better performance
    if (isMobile) {
      return {
        filter: 'contrast(1.1) brightness(0.9) saturate(0.6) sepia(0.2)',
      };
    }

    // Desktop: dynamic filters based on mouse position
    // Contrast varies from 1.0 to 1.5 based on X
    const contrast = 1.0 + mousePos.normalizedX * 0.5;
    // Brightness varies from 0.8 to 1.2 based on Y
    const brightness = 0.8 + mousePos.normalizedY * 0.4;
    // Saturate decreases as you move down (more B&W at bottom)
    const saturate = 1.0 - mousePos.normalizedY * 0.8;
    // Sepia adds gold tint, stronger towards corners
    const distFromCenter = Math.sqrt(
      Math.pow(mousePos.normalizedX - 0.5, 2) + Math.pow(mousePos.normalizedY - 0.5, 2)
    );
    const sepia = distFromCenter * 0.6;

    return {
      filter: `contrast(${contrast}) brightness(${brightness}) saturate(${saturate}) sepia(${sepia})`,
    };
  }, [mousePos.normalizedX, mousePos.normalizedY, isMobile]);

  return (
    <div
      ref={containerRef}
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 w-full h-full overflow-hidden pointer-events-none z-0 ${className}`}
    >
      {/* Video element with CSS-based dithering */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          ...getFilterStyles(),
          opacity: isLoaded ? 0.7 : 0,
          transition: isMobile ? 'opacity 0.8s ease-in-out' : 'opacity 0.8s ease-in-out, filter 0.15s ease-out',
        }}
        muted
        playsInline
        preload={isMobile ? 'metadata' : 'auto'}
        autoPlay={isMobile}
        loop
      />

      {/* Pixelation/Dither overlay using SVG filter (desktop only - too heavy for mobile) */}
      {!isMobile && (
        <svg className="absolute" style={{ width: 0, height: 0 }}>
          <defs>
            <filter id="dither-filter" x="0" y="0" width="100%" height="100%">
              {/* Pixelate effect */}
              <feFlood x="4" y="4" height="2" width="2" />
              <feComposite width="10" height="10" />
              <feTile result="a" />
              <feComposite in="SourceGraphic" in2="a" operator="in" />
              <feMorphology operator="dilate" radius="5" />
              {/* Add noise for dither effect */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency={0.5 + mousePos.normalizedX * 0.5}
                numOctaves="2"
                result="noise"
              />
              <feDisplacementMap
                in2="noise"
                scale={2 + mousePos.normalizedY * 3}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      {/* Scanlines overlay (simplified on mobile) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isMobile
            ? `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)`
            : `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, ${0.2 + mousePos.normalizedY * 0.2}) 2px, rgba(0, 0, 0, ${0.2 + mousePos.normalizedY * 0.2}) 4px)`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* CRT curvature vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.5) 85%,
            rgba(0, 0, 0, 0.9) 100%
          )`,
        }}
      />

      {/* Mouse-following gold spotlight (desktop only) */}
      {!isMobile && (
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(
              circle,
              rgba(255, 215, 0, 0.08) 0%,
              rgba(255, 215, 0, 0.03) 30%,
              transparent 70%
            )`,
            left: mousePos.x - 300,
            top: mousePos.y - 300,
            transition: 'left 0.2s ease-out, top 0.2s ease-out',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Noise/grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Gold color overlay tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.05) 0%,
            transparent 50%,
            rgba(139, 69, 19, 0.05) 100%
          )`,
          mixBlendMode: 'color',
        }}
      />
    </div>
  );
}
