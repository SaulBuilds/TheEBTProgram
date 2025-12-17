'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Character image paths
export const CARD_CHARACTERS = {
  pepeClimbing: '/cardAttachements/pepe_climbing_over.png',
  dogePeeking: '/cardAttachements/doge_peeking.png',
  pepeChill: '/cardAttachements/pepe_chill.png',
  apuSearching: '/cardAttachements/apu_searching.png',
  doomerManhole: '/cardAttachements/doomer_mahole.png',
  boomerLooking: '/cardAttachements/boomer_looking.png',
  chadPeaking: '/cardAttachements/chad_peaking.png',
  copeLooking: '/cardAttachements/cope_looking.png',
  pikaPeeking: '/cardAttachements/pika_peeking.png',
  onePeek: '/cardAttachements/one_peek.png',
  frogRiding: '/cardAttachements/frog_riding.png',
} as const;

export type CharacterKey = keyof typeof CARD_CHARACTERS;

// Position anchor point on the card edge
export type AnchorPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left-top'
  | 'left-center'
  | 'left-bottom'
  | 'right-top'
  | 'right-center'
  | 'right-bottom'
  | 'corner-top-right'
  | 'corner-top-left'
  | 'corner-bottom-right'
  | 'corner-bottom-left';

// Animation types for scroll reveal
export type AnimationType =
  | 'pop-up'      // Rises from below edge
  | 'pop-down'    // Drops from above edge
  | 'slide-in'    // Slides from outside card
  | 'peek'        // Quick peek then settle
  | 'bounce'      // Bouncy entrance
  | 'fade'        // Simple fade in
  | 'none';       // No animation

interface CardCharacterProps {
  character: CharacterKey;
  anchor: AnchorPosition;
  animation?: AnimationType;
  // Size as percentage of card width (responsive)
  size?: number;
  // Fine-tune offsets (in pixels, will be converted to % for responsiveness)
  offsetX?: number;
  offsetY?: number;
  // Z-index for layering
  zIndex?: number;
  // Flip horizontally
  flipX?: boolean;
  // Custom class for additional styling
  className?: string;
  // Animation delay in seconds
  animationDelay?: number;
  // Whether to trigger on scroll
  scrollTrigger?: boolean;
}

// Get CSS position based on anchor
// offsetX and offsetY are now percentages for responsive scaling
function getPositionStyles(
  anchor: AnchorPosition,
  offsetX: number,
  offsetY: number
): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
  };

  switch (anchor) {
    // Top edge positions - locked to top: 0 (the card border)
    // offsetY adjusts translateY percentage (relative to character's own height, not card height)
    // This keeps the character locked to the card border at all screen sizes
    case 'top-left':
      return { ...baseStyles, top: 0, left: `${10 + offsetX}%`, transform: `translateY(${-85 + offsetY}%)` };
    case 'top-center':
      return { ...baseStyles, top: 0, left: '50%', transform: `translate(-50%, ${-85 + offsetY}%)` };
    case 'top-right':
      return { ...baseStyles, top: 0, right: `${10 + offsetX}%`, transform: `translateY(${-85 + offsetY}%)` };

    // Bottom edge positions - locked to bottom: 0, offsetX shifts horizontally, offsetY adjusts vertical
    case 'bottom-left':
      return { ...baseStyles, bottom: 0, left: `${10 + offsetX}%`, transform: `translateY(${85 + offsetY}%)` };
    case 'bottom-center':
      return { ...baseStyles, bottom: 0, left: `${50 + offsetX}%`, transform: `translate(-50%, ${85 + offsetY}%)` };
    case 'bottom-right':
      return { ...baseStyles, bottom: 0, right: `${10 - offsetX}%`, transform: `translateY(${85 + offsetY}%)` };

    // Left edge positions - percentage based
    case 'left-top':
      return { ...baseStyles, top: `${10 + offsetY}%`, left: 0, transform: `translateX(${-80 + offsetX}%)` };
    case 'left-center':
      return { ...baseStyles, top: '50%', left: 0, transform: `translate(${-80 + offsetX}%, -50%)` };
    case 'left-bottom':
      return { ...baseStyles, bottom: `${10 - offsetY}%`, left: 0, transform: `translateX(${-80 + offsetX}%)` };

    // Right edge positions - percentage based
    case 'right-top':
      return { ...baseStyles, top: `${10 + offsetY}%`, right: 0, transform: `translateX(${80 + offsetX}%)` };
    case 'right-center':
      return { ...baseStyles, top: '50%', right: 0, transform: `translate(${80 + offsetX}%, -50%)` };
    case 'right-bottom':
      return { ...baseStyles, bottom: `${10 - offsetY}%`, right: 0, transform: `translateX(${80 + offsetX}%)` };

    // Corner positions (for climbing characters) - percentage based
    case 'corner-top-right':
      return { ...baseStyles, top: 0, right: `${offsetX}%`, transform: `translate(30%, ${-70 + offsetY}%)` };
    case 'corner-top-left':
      return { ...baseStyles, top: 0, left: `${offsetX}%`, transform: `translate(-30%, ${-70 + offsetY}%)` };
    case 'corner-bottom-right':
      return { ...baseStyles, bottom: 0, right: `${offsetX}%`, transform: `translate(30%, ${70 + offsetY}%)` };
    case 'corner-bottom-left':
      return { ...baseStyles, bottom: 0, left: `${offsetX}%`, transform: `translate(-30%, ${70 + offsetY}%)` };

    default:
      return baseStyles;
  }
}

// Get initial animation state based on animation type and anchor
function getInitialState(animation: AnimationType, anchor: AnchorPosition) {
  switch (animation) {
    case 'pop-up':
      return { y: 50, opacity: 0 };
    case 'pop-down':
      return { y: -50, opacity: 0 };
    case 'slide-in':
      if (anchor.includes('left')) return { x: -100, opacity: 0 };
      if (anchor.includes('right')) return { x: 100, opacity: 0 };
      return { y: 50, opacity: 0 };
    case 'peek':
      return { y: 30, opacity: 0, scale: 0.8 };
    case 'bounce':
      return { y: -100, opacity: 0 };
    case 'fade':
      return { opacity: 0 };
    default:
      return {};
  }
}

// Get animation config based on type
function getAnimationConfig(animation: AnimationType, delay: number) {
  const baseConfig = {
    duration: 0.6,
    delay,
    ease: 'power2.out',
  };

  switch (animation) {
    case 'pop-up':
    case 'pop-down':
      return { ...baseConfig, y: 0, opacity: 1 };
    case 'slide-in':
      return { ...baseConfig, x: 0, y: 0, opacity: 1 };
    case 'peek':
      return { ...baseConfig, y: 0, opacity: 1, scale: 1, ease: 'elastic.out(1, 0.5)', duration: 0.8 };
    case 'bounce':
      return { ...baseConfig, y: 0, opacity: 1, ease: 'bounce.out', duration: 1 };
    case 'fade':
      return { ...baseConfig, opacity: 1 };
    default:
      return {};
  }
}

export function CardCharacter({
  character,
  anchor,
  animation = 'none', // Default to no animation - static placement
  size = 20,
  offsetX = 0,
  offsetY = 0,
  zIndex = 10,
  flipX = false,
  className = '',
  animationDelay = 0,
  scrollTrigger = false, // Default to no scroll trigger
}: CardCharacterProps) {
  const characterRef = useRef<HTMLDivElement>(null);

  // TODO: Add frame-based peeking animations later
  // The characters are now statically positioned at their correct locations
  // Frame animations can be added to create peeking effects without GSAP scroll interference

  useEffect(() => {
    // Skip all GSAP animations - keep characters static
    if (!characterRef.current || animation === 'none' || !scrollTrigger) return;

    const element = characterRef.current;
    const initialState = getInitialState(animation, anchor);
    const animationConfig = getAnimationConfig(animation, animationDelay);

    // Set initial state
    gsap.set(element, initialState);

    if (scrollTrigger) {
      // Create scroll-triggered animation
      gsap.to(element, {
        ...animationConfig,
        scrollTrigger: {
          trigger: element.parentElement,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      });
    } else {
      // Play animation immediately
      gsap.to(element, animationConfig);
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element.parentElement) {
          trigger.kill();
        }
      });
    };
  }, [animation, anchor, animationDelay, scrollTrigger]);

  const positionStyles = getPositionStyles(anchor, offsetX, offsetY);

  return (
    <div
      ref={characterRef}
      className={`pointer-events-none select-none ${className}`}
      style={{
        ...positionStyles,
        zIndex,
        width: `${size}%`,
        transform: `${positionStyles.transform || ''} ${flipX ? 'scaleX(-1)' : ''}`.trim(),
      }}
    >
      <Image
        src={CARD_CHARACTERS[character]}
        alt=""
        width={200}
        height={200}
        className="w-full h-auto object-contain"
        priority={false}
      />
    </div>
  );
}

// Wrapper component that makes a card "character-aware" with proper overflow
interface CharacterCardProps {
  children: React.ReactNode;
  className?: string;
  characters?: Array<Omit<CardCharacterProps, 'scrollTrigger'> & { scrollTrigger?: boolean }>;
  // Control overflow visibility for characters
  overflowVisible?: boolean;
}

export function CharacterCard({
  children,
  className = '',
  characters = [],
  overflowVisible = true,
}: CharacterCardProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ overflow: overflowVisible ? 'visible' : 'hidden' }}
    >
      {children}
      {characters.map((charProps, index) => (
        <CardCharacter key={`${charProps.character}-${index}`} {...charProps} />
      ))}
    </div>
  );
}

// Preset configurations for common character placements
export const CHARACTER_PRESETS = {
  // Doge peeking over the top center of a card
  dogePeekTop: {
    character: 'dogePeeking' as CharacterKey,
    anchor: 'top-center' as AnchorPosition,
    animation: 'pop-up' as AnimationType,
    size: 25,
    offsetY: 5,
  },
  // Pepe climbing over top-right corner
  pepeClimbCorner: {
    character: 'pepeClimbing' as CharacterKey,
    anchor: 'corner-top-right' as AnchorPosition,
    animation: 'slide-in' as AnimationType,
    size: 30,
  },
  // Pepe chill peeking over top
  pepeChillTop: {
    character: 'pepeChill' as CharacterKey,
    anchor: 'top-center' as AnchorPosition,
    animation: 'pop-up' as AnimationType,
    size: 25,
    offsetY: 5,
  },
  // Boomer peeking from left side
  boomerPeekLeft: {
    character: 'boomerLooking' as CharacterKey,
    anchor: 'left-center' as AnchorPosition,
    animation: 'slide-in' as AnimationType,
    size: 20,
    flipX: false,
  },
  // Chad peeking over top
  chadPeekTop: {
    character: 'chadPeaking' as CharacterKey,
    anchor: 'top-center' as AnchorPosition,
    animation: 'pop-up' as AnimationType,
    size: 25,
    offsetY: 5,
  },
  // Doomer coming up from bottom (manhole style)
  doomerBottom: {
    character: 'doomerManhole' as CharacterKey,
    anchor: 'bottom-center' as AnchorPosition,
    animation: 'pop-up' as AnimationType,
    size: 22,
    offsetY: -10,
  },
  // Pikachu peeking over
  pikaPeekTop: {
    character: 'pikaPeeking' as CharacterKey,
    anchor: 'top-center' as AnchorPosition,
    animation: 'peek' as AnimationType,
    size: 18,
    offsetY: 5,
  },
  // Luffy (One Piece) peeking with arm extended
  luffyPeekTop: {
    character: 'onePeek' as CharacterKey,
    anchor: 'top-left' as AnchorPosition,
    animation: 'slide-in' as AnimationType,
    size: 28,
    offsetX: 5,
    offsetY: 5,
  },
  // Apu searching on the ground
  apuSearchBottom: {
    character: 'apuSearching' as CharacterKey,
    anchor: 'bottom-left' as AnchorPosition,
    animation: 'slide-in' as AnimationType,
    size: 25,
    offsetY: -20,
  },
  // Cope looking over
  copePeekTop: {
    character: 'copeLooking' as CharacterKey,
    anchor: 'top-right' as AnchorPosition,
    animation: 'pop-up' as AnimationType,
    size: 18,
    offsetX: 5,
    offsetY: 5,
  },
  // Dat boi on unicycle (frog riding)
  datBoiRide: {
    character: 'frogRiding' as CharacterKey,
    anchor: 'bottom-right' as AnchorPosition,
    animation: 'bounce' as AnimationType,
    size: 20,
    offsetX: -10,
    offsetY: -30,
  },
} as const;
