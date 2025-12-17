'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Character image paths
const PARALLAX_CHARACTERS = {
  // Balloons - 3 depth layers
  balloonForeground: '/parralax_background_characters/balloon_foreground.png',
  balloonMiddleground: '/parralax_background_characters/balloon_middleground.png',
  balloonBackground: '/parralax_background_characters/Balloon_background.png',
  // Skydivers
  skydiverPika: '/parralax_background_characters/skydiver_pika.png',
  skydiverWojack: '/parralax_background_characters/skydiver_wojack.png',
  skydiverNpc: '/parralax_background_characters/skydiver_npc.png',
  skydiverWojacksgirl: '/parralax_background_characters/skydiver_wojacksgirl.png',
  // Hang Gliders
  gliderChad: '/parralax_background_characters/glider_chad.png',
  gliderPepe: '/parralax_background_characters/glider_pepe.png',
  // Wingsuits (Squirrel suits)
  wingsuitGiga: '/parralax_background_characters/squirrel_giga.png',
  wingsuitDoge: '/parralax_background_characters/squirrel_doge.png',
  wingsuitApu: '/parralax_background_characters/squirrel_apu.png',
} as const;

type CharacterType = keyof typeof PARALLAX_CHARACTERS;

// Depth layer determines size and parallax speed
type DepthLayer = 'foreground' | 'middleground' | 'background';

// Track type determines movement behavior
type TrackType = 'balloon' | 'skydiver' | 'glider' | 'wingsuit';

// Side of screen
type Side = 'left' | 'right';

// Direction for gliders (they only go forward)
type GliderDirection = 'left-to-right' | 'right-to-left';

interface ParallaxElement {
  id: string;
  character: CharacterType;
  track: TrackType;
  depth: DepthLayer;
  side: Side;
  // Starting position as percentage from top
  startY: number;
  // Horizontal offset from edge (in vw)
  offsetX: number;
  // For gliders - which direction they travel
  gliderDirection?: GliderDirection;
  // Optional rotation
  rotation?: number;
  // Flip horizontally
  flipX?: boolean;
}

// Depth layer configurations
const DEPTH_CONFIG: Record<DepthLayer, { size: number; speed: number; opacity: number; zIndex: number }> = {
  foreground: { size: 180, speed: 1.5, opacity: 1, zIndex: 5 },
  middleground: { size: 120, speed: 1.0, opacity: 1, zIndex: 3 },
  background: { size: 70, speed: 0.5, opacity: 1, zIndex: 1 },
};

// Track configurations - how each type moves
const TRACK_CONFIG: Record<TrackType, { yMultiplier: number; xMultiplier: number }> = {
  balloon: { yMultiplier: -0.3, xMultiplier: 0.05 }, // Floats up slowly, slight horizontal drift
  skydiver: { yMultiplier: 0.8, xMultiplier: 0.1 }, // Falls fast
  glider: { yMultiplier: 0.4, xMultiplier: 0.6 }, // Diagonal forward motion
  wingsuit: { yMultiplier: 0.5, xMultiplier: 0.4 }, // Diagonal glide
};

// Define all parallax elements
const PARALLAX_ELEMENTS: ParallaxElement[] = [
  // === BALLOONS (rise slowly on scroll) ===
  // Left side balloons
  {
    id: 'balloon-bg-left',
    character: 'balloonBackground',
    track: 'balloon',
    depth: 'background',
    side: 'left',
    startY: 15,
    offsetX: 2,
  },
  {
    id: 'balloon-mid-left',
    character: 'balloonMiddleground',
    track: 'balloon',
    depth: 'middleground',
    side: 'left',
    startY: 45,
    offsetX: 5,
  },
  // Right side balloons
  {
    id: 'balloon-fg-right',
    character: 'balloonForeground',
    track: 'balloon',
    depth: 'foreground',
    side: 'right',
    startY: 60,
    offsetX: 3,
  },
  {
    id: 'balloon-bg-right',
    character: 'balloonBackground',
    track: 'balloon',
    depth: 'background',
    side: 'right',
    startY: 25,
    offsetX: 8,
  },

  // === SKYDIVERS (fall on scroll) ===
  {
    id: 'skydiver-pika',
    character: 'skydiverPika',
    track: 'skydiver',
    depth: 'foreground',
    side: 'right',
    startY: 5,
    offsetX: 12,
    rotation: 15,
  },
  {
    id: 'skydiver-wojack',
    character: 'skydiverWojack',
    track: 'skydiver',
    depth: 'middleground',
    side: 'left',
    startY: 20,
    offsetX: 8,
    rotation: -10,
    flipX: true,
  },
  {
    id: 'skydiver-npc',
    character: 'skydiverNpc',
    track: 'skydiver',
    depth: 'background',
    side: 'right',
    startY: 35,
    offsetX: 5,
    rotation: 5,
  },
  {
    id: 'skydiver-girl',
    character: 'skydiverWojacksgirl',
    track: 'skydiver',
    depth: 'middleground',
    side: 'left',
    startY: 55,
    offsetX: 15,
    rotation: -5,
    flipX: true,
  },

  // === GLIDERS (diagonal, always forward) ===
  {
    id: 'glider-chad',
    character: 'gliderChad',
    track: 'glider',
    depth: 'foreground',
    side: 'left',
    startY: 10,
    offsetX: -5, // Start off-screen
    gliderDirection: 'left-to-right',
    rotation: 5,
  },
  {
    id: 'glider-pepe',
    character: 'gliderPepe',
    track: 'glider',
    depth: 'middleground',
    side: 'right',
    startY: 70,
    offsetX: -5, // Start off-screen
    gliderDirection: 'right-to-left',
    rotation: -5,
    flipX: true,
  },

  // === WINGSUITS (diagonal glide) ===
  {
    id: 'wingsuit-giga',
    character: 'wingsuitGiga',
    track: 'wingsuit',
    depth: 'foreground',
    side: 'left',
    startY: 30,
    offsetX: 2,
    gliderDirection: 'left-to-right',
    rotation: 15,
  },
  {
    id: 'wingsuit-doge',
    character: 'wingsuitDoge',
    track: 'wingsuit',
    depth: 'middleground',
    side: 'right',
    startY: 50,
    offsetX: 4,
    gliderDirection: 'right-to-left',
    rotation: -10,
    flipX: true,
  },
  {
    id: 'wingsuit-apu',
    character: 'wingsuitApu',
    track: 'wingsuit',
    depth: 'background',
    side: 'left',
    startY: 80,
    offsetX: 10,
    gliderDirection: 'left-to-right',
    rotation: 12,
  },
];

interface ParallaxItemProps {
  element: ParallaxElement;
}

function ParallaxItem({ element }: ParallaxItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const depthConfig = DEPTH_CONFIG[element.depth];
  const trackConfig = TRACK_CONFIG[element.track];

  useEffect(() => {
    if (!itemRef.current) return;

    const item = itemRef.current;

    // Calculate movement based on track type and depth
    const baseYMovement = trackConfig.yMultiplier * depthConfig.speed * 100; // vh units
    let baseXMovement = trackConfig.xMultiplier * depthConfig.speed * 100; // vw units

    // For gliders, ensure forward-only motion
    if (element.track === 'glider' || element.track === 'wingsuit') {
      if (element.gliderDirection === 'right-to-left') {
        baseXMovement = -Math.abs(baseXMovement);
      } else {
        baseXMovement = Math.abs(baseXMovement);
      }
    }

    // Create the scroll-triggered animation
    gsap.to(item, {
      y: `${baseYMovement}vh`,
      x: `${baseXMovement}vw`,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // Smooth scrubbing
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.trigger === document.body) {
          // Only kill triggers we created
        }
      });
    };
  }, [element, depthConfig, trackConfig]);

  // Calculate initial position
  const initialStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${element.startY}vh`,
    [element.side]: `${element.offsetX}vw`,
    width: depthConfig.size,
    height: 'auto',
    opacity: depthConfig.opacity,
    zIndex: depthConfig.zIndex,
    pointerEvents: 'none',
    transform: `rotate(${element.rotation || 0}deg) ${element.flipX ? 'scaleX(-1)' : ''}`,
    willChange: 'transform',
  };

  return (
    <div ref={itemRef} style={initialStyle} className="parallax-item">
      <Image
        src={PARALLAX_CHARACTERS[element.character]}
        alt=""
        width={depthConfig.size}
        height={depthConfig.size}
        className="w-full h-auto object-contain"
        priority={element.depth === 'foreground'}
      />
    </div>
  );
}

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Refresh ScrollTrigger after mount
    ScrollTrigger.refresh();

    return () => {
      // Clean up all ScrollTriggers on unmount
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="parallax-background pointer-events-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      {PARALLAX_ELEMENTS.map((element) => (
        <ParallaxItem key={element.id} element={element} />
      ))}
    </div>
  );
}

// Export for customization
export { PARALLAX_CHARACTERS, PARALLAX_ELEMENTS, DEPTH_CONFIG, TRACK_CONFIG };
export type { ParallaxElement, CharacterType, DepthLayer, TrackType, Side, GliderDirection };
