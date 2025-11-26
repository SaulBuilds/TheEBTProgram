/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ebt-green': '#2E7D32',
        'ebt-gold': '#FFD700',
        'ebt-navy': '#1A237E',
        'welfare-red': '#DC143C',
        'food-brown': '#8B4513',
        'stamp-blue': '#4169E1',
      },
      fontFamily: {
        'sans': ['var(--font-league-spartan)', 'system-ui', 'sans-serif'],
        'heading': ['var(--font-bebas-neue)', 'sans-serif'],
        'mono': ['Courier New', 'monospace'],
        'retro': ['VT323', 'monospace'],
        'govt': ['Georgia', 'serif'],
      },
      animation: {
        'glitch': 'glitch 2s infinite',
        'scan': 'scan 4s linear infinite',
        'blink': 'blink 1s step-end infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'dither-pattern': 'url("data:image/svg+xml,%3Csvg width="2" height="2" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="1" height="1" fill="%23000"%3E%3C/rect%3E%3C/svg%3E")',
        'scan-lines': 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
      },
      backdropFilter: {
        'glitch': 'hue-rotate(90deg) contrast(1.5)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};