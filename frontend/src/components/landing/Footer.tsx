'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-heading text-ebt-gold mb-4 tracking-wide">EBT CARD</h3>
              <p className="text-sm text-gray-400">
                Supplemental Nutrition Assistance Program. Est. 2024.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-heading text-white mb-4 tracking-wide">PROTOCOL</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-sm text-gray-400 hover:text-ebt-gold">
                  About
                </Link>
                <Link href="/about" className="block text-sm text-gray-400 hover:text-ebt-gold">
                  Tokenomics
                </Link>
                <Link href="/about" className="block text-sm text-gray-400 hover:text-ebt-gold">
                  Smart Contracts
                </Link>
              </div>
            </div>

            {/* Community */}
            <div>
              <h4 className="text-sm font-heading text-white mb-4 tracking-wide">COMMUNITY</h4>
              <div className="space-y-2">
                <a
                  href="https://twitter.com/ebtcard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-400 hover:text-ebt-gold"
                >
                  Twitter
                </a>
                <a
                  href="https://discord.gg/ebtcard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-400 hover:text-ebt-gold"
                >
                  Discord
                </a>
                <a
                  href="https://github.com/ebtcard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-400 hover:text-ebt-gold"
                >
                  GitHub
                </a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-heading text-white mb-4 tracking-wide">LEGAL</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-gray-400 hover:text-ebt-gold">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="block text-sm text-gray-400 hover:text-ebt-gold">
                  Privacy Policy
                </Link>
                <Link href="/disclaimer" className="block text-sm text-gray-400 hover:text-ebt-gold">
                  Disclaimer
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-gray-500">
                2024 EBT Card. Not affiliated with any government, bank, or your disappointed parents.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  DYOR. NFA. WAGMI?
                </span>
                <span className="text-xs font-heading text-welfare-red tracking-wide">
                  PROBABLY NOTHING
                </span>
              </div>
            </div>
          </div>

          {/* ASCII Art */}
          <div className="mt-8 text-center">
            <pre className="text-xs text-ebt-gold/20 font-mono inline-block">
{`
 _____ ____ _____    ____    _    ____  ____
| ____| __ )_   _|  / ___|  / \\  |  _ \\|  _ \\
|  _| |  _ \\ | |   | |     / _ \\ | |_) | | | |
| |___| |_) || |   | |___ / ___ \\|  _ <| |_| |
|_____|____/ |_|    \\____/_/   \\_\\_| \\_\\____/
`}
            </pre>
          </div>
        </div>
      </div>
    </footer>
  );
}
