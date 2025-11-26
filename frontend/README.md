# EBT Card Frontend

A satirical Web3 application that gamifies welfare distribution through NFTs and cryptocurrency tokens. Built with Next.js 14, TypeScript, and Privy authentication.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Environment variables (see `.env.local.example`)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Privy (embedded wallets + social login)
- **Web3**: wagmi v2 + viem
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + Custom animations
- **Effects**: Canvas API for dithering, CSS for glitch effects

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Privy + Web3 providers
├── components/
│   ├── landing/           # Landing page sections
│   │   ├── Hero.tsx       # Hero with dithering effect
│   │   ├── Stats.tsx      # Live platform statistics
│   │   ├── Features.tsx   # Feature grid
│   │   ├── HowItWorks.tsx # Step-by-step guide
│   │   ├── Tokenomics.tsx # Token distribution chart
│   │   └── Footer.tsx     # Site footer
│   ├── layout/            # Layout components
│   │   └── Navbar.tsx     # Navigation with auth
│   └── ui/                # Reusable UI components
│       ├── Button.tsx     # Styled button component
│       ├── DitheredImage.tsx # Canvas-based dithering
│       ├── GlitchText.tsx # Glitch text effect
│       └── TypewriterText.tsx # Typewriter animation
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

## 🎨 Features

### Implemented ✅
- **Modern Next.js 14 Setup**: App Router, TypeScript, strict mode
- **Privy Authentication**: Email, wallet, Twitter, Discord login
- **Responsive Landing Page**: Mobile-first design
- **Visual Effects**:
  - Dithering effect on images
  - Glitch text animations
  - Typewriter effect
  - Scanline overlays
  - Retro CRT aesthetic
- **Live Statistics**: Platform stats with animations
- **Feature Showcase**: Animated feature cards
- **Tokenomics Display**: Interactive pie chart

### In Progress 🚧
- Application flow with gamification
- Wallet dashboard
- Web3 contract interactions
- Monthly claim system
- Leaderboard and achievements
- Social sharing features

## 🎮 User Flow

1. **Landing Page**: Users see hero with dithered golden EBT card
2. **Connect Wallet**: Privy handles wallet connection/creation
3. **Apply**: Multi-step gamified application process
4. **Mint NFT**: Pay 0.02 ETH to mint EBT card
5. **Receive Tokens**: Get 10,000 $FOOD tokens initially
6. **Monthly Claims**: Return monthly for additional tokens
7. **Compete**: Climb leaderboard, unlock achievements

## 🔧 Development

### Run Development Server
```bash
npm run dev
```

### Build Production
```bash
npm run build
npm run start
```

### Run Tests
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

### Type Checking
```bash
npm run type-check
```

## 🚀 Deployment

The app is configured for deployment on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🔐 Environment Variables

Required environment variables:

- `NEXT_PUBLIC_PRIVY_APP_ID`: Privy application ID
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_CHAIN_ID`: Blockchain chain ID (11155111 for Sepolia)
- `NEXT_PUBLIC_RPC_URL`: Ethereum RPC endpoint
- `NEXT_PUBLIC_EBT_PROGRAM_ADDRESS`: EBT NFT contract address
- `NEXT_PUBLIC_FOOD_STAMPS_ADDRESS`: $FOOD token contract address

## 📝 Next Steps

1. **Complete Application Flow**: Build multi-step form with achievements
2. **Implement Dashboard**: User wallet, claims, history
3. **Add Contract Interactions**: Mint, claim, transfer functions
4. **Build Leaderboard**: Rankings, streaks, social features
5. **Create Admin Panel**: Application approval interface
6. **Add WebSocket Support**: Real-time updates
7. **Implement Achievements**: Unlock system with notifications
8. **Optimize Performance**: Image optimization, code splitting

## ⚠️ Disclaimer

This is a satirical art project about wealth inequality and social safety nets. Not real government assistance. Cryptocurrency tokens have no guaranteed value.

## 📄 License

MIT