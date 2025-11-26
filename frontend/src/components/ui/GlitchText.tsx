'use client';

import { useEffect, useRef } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = '' }: GlitchTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Add occasional extra glitch effect
    const interval = setInterval(() => {
      element.style.animation = 'none';
      setTimeout(() => {
        element.style.animation = '';
      }, 10);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      ref={textRef}
      className={`glitch ${className}`}
      data-text={text}
    >
      {text}
    </span>
  );
}