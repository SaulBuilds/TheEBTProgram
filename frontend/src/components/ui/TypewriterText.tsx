'use client';

import { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export function TypewriterText({ text, className = '', speed = 50 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        const currentIndex = indexRef.current;
        setDisplayedText(text.slice(0, currentIndex + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={`terminal-cursor ${className}`}>
      {displayedText}
    </span>
  );
}