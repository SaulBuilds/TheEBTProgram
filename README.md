# The EBT Program

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C)](https://book.getfoundry.sh/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

A satirical Web3 application that gamifies welfare distribution through NFTs with token-bound accounts (ERC-6551) and cryptocurrency tokens. Built as commentary on wealth inequality and social safety nets.

> **Disclaimer**: This is a satirical art project. Not real government assistance. Cryptocurrency tokens have no guaranteed value.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Tokenomics](#tokenomics)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Overview

The EBT Program allows users to:

1. **Apply** for an EBT Card through a gamified application process
2. **Mint** an EBT Card NFT (0.02 - 2 ETH, you choose your contribution)
3. **Receive** a Token Bound Account (ERC-6551) with $EBTC tokens
4. **Claim** monthly token stipends (3 claims per season)
5. **Reapply** each season to continue receiving benefits

### Key Features

- **ERC-721 NFTs** with unique EBT Card designs
- **ERC-6551 Token Bound Accounts** - each NFT owns its own wallet
- **$EBTC ERC-20 Token** - 20 billion max supply
- **Fair Fundraising** - soft cap protection with refunds if not met
- **Marketplace Safety** - automatic TBA locking when NFTs are listed

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │───▶│   Backend    │───▶│   Contracts  │      │
│  │  (Next.js)   │    │  (Express)   │    │  (Solidity)  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│        │                    │                    │               │
│        ▼                    ▼                    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    Privy     │    │   Prisma     │    │   Sepolia    │      │
│  │    Auth      │    │   (SQLite)   │    │   Testnet    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Repository Structure

```
TheEBTProgram/
├── frontend/                # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities and hooks
│   └── package.json
│
├── smart-contracts/         # Foundry smart contracts
│   ├── contracts/          # Solidity contracts
│   ├── foundry-test/       # Foundry tests
│   ├── script/             # Deployment scripts
│   └── foundry.toml
│
├── ebt-express/            # Express.js API backend
│   ├── src/
│   ├── prisma/             # Database schema
│   └── package.json
│
└── docs/                   # Additional documentation
```

## Smart Contracts

### Deployed Contracts (Sepolia Testnet)

| Contract | Address | Description |
|----------|---------|-------------|
| EBTProgram | `0x9A7809EB76D30A754b730Dcfff1286bBff0775aa` | Main NFT contract (SNAP) |
| FoodStamps | `0xd89406651698c85423e94D932bac95fA5Ab729Ec` | ERC-20 token ($EBTC) |
| ERC6551Registry | `0xb22F642c3303bDe27131f58b46E7d75Aa194df0c` | TBA registry |
| ERC6551Account | `0xb812Dd421F2AB112fc7c33c75369148D115bEB4E` | TBA implementation |
| EBTApplication | `0x2E84f1fFF8E37A55Cc90B2f268C0d233d5aE5045` | Application management |
| LiquidityVault | `0x6d15041ce06E367776CdcE1aFf1A2fAD31f44131` | Token distribution |
| TeamVesting | `0xa1400a541c0fE2364fd502003C5273AEFaA0D244` | Team token vesting |

### Contract Interaction Flow

```
User Journey:
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. Apply    ──▶  EBTApplication.apply4EBT()                  │
│                          ↓                                      │
│   2. Approve  ──▶  Admin approves application                  │
│                          ↓                                      │
│   3. Mint     ──▶  EBTProgram.mint() + 0.02-2 ETH              │
│                          ↓                                      │
│   4. Receive  ──▶  NFT + TBA created + $EBTC distributed       │
│                          ↓                                      │
│   5. Claim    ──▶  EBTProgram.claim() (monthly, up to 3x)      │
│                          ↓                                      │
│   6. Reapply  ──▶  EBTProgram.reapply() (new season)           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Tokenomics

### $EBTC Token Distribution (20 Billion Total Supply)

| Allocation | Percentage | Amount | Recipient |
|------------|------------|--------|-----------|
| Protocol (Liquidity) | 65% | 13B | LiquidityVault |
| Marketing | 20% | 4B | Marketing Wallet |
| NFT Holder TGE | 10% | 2B | EBTProgram (airdrops) |
| Team | 5% | 1B | TeamVesting |

### ETH Distribution (From NFT Sales)

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| Liquidity | 65% | LP provisioning & buybacks |
| Marketing | 20% | Growth & partnerships |
| Treasury | 10% | Operations |
| Team | 5% | Core team |

### Fundraising Parameters

| Parameter | Value |
|-----------|-------|
| Mint Price Range | 0.02 - 2 ETH |
| Soft Cap | 20 ETH |
| Hard Cap | 2,000 ETH |
| Fundraising Period | 30 days |
| Base Tokens per 0.02 ETH | 20,000 $EBTC |
| Monthly Claim Interval | 30 days |
| Max Claims per Season | 3 |

## Quick Start

### Prerequisites

- Node.js 18+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/TheEBTProgram.git
cd TheEBTProgram

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../ebt-express && npm install

# Install contract dependencies
cd ../smart-contracts && forge install
```

### Environment Setup

```bash
# Frontend (.env.local)
cp frontend/.env.local.example frontend/.env.local

# Backend (.env)
cp ebt-express/.env.example ebt-express/.env

# Smart contracts (.env)
cp smart-contracts/.env.example smart-contracts/.env
```

### Run Development

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend (optional)
cd ebt-express && npm run dev

# Terminal 3: Local Blockchain (optional)
cd smart-contracts && anvil
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Run production build
npm start
```

### Smart Contract Development

```bash
cd smart-contracts

# Compile contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Run specific test
forge test --match-test testMintSuccess

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

### Backend Development

```bash
cd ebt-express

# Development server
npm run dev

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Run tests
npm test
```

## Deployment

### Deploy Smart Contracts

```bash
cd smart-contracts

# Set environment variables
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_rpc_url
export ETHERSCAN_API_KEY=your_api_key

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv
```

### Deploy Frontend (Vercel)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy Backend (Render/Railway)

The backend includes a `render.yaml` for Render deployment. Configure your environment variables and deploy.

## Testing

### Smart Contract Tests

```bash
cd smart-contracts

# Run all tests
forge test

# Run with coverage
forge coverage

# Run fuzz tests
forge test --match-contract Fuzz

# Run integration tests
forge test --match-contract Integration
```

### Test Structure

```
foundry-test/
├── unit/                    # Unit tests
│   ├── EBTProgram.t.sol
│   ├── FoodStamps.t.sol
│   └── ...
├── integration/             # Integration tests
│   └── FullFlow.t.sol
├── fuzz/                    # Fuzz tests
│   └── MintFuzz.t.sol
└── invariant/               # Invariant tests
    └── Invariants.t.sol
```

## Security

### Audit Status

See [SECURITY_AUDIT.md](smart-contracts/SECURITY_AUDIT.md) for the full security audit report.

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 6 | All Fixed |
| High | 8 | In Progress |
| Medium | 9 | Planned |
| Low | 8 | Best Practices |

### Key Security Features

- **Reentrancy Protection**: All state-modifying functions use `nonReentrant`
- **Access Control**: Role-based permissions with OpenZeppelin
- **TBA Locking**: Automatic asset protection during marketplace listings
- **Initialization Checks**: Contracts require proper setup before operation
- **Pausable**: Emergency pause functionality on critical contracts

### Reporting Vulnerabilities

Please report security vulnerabilities to security@ebtprogram.xyz or open a private security advisory on GitHub.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`forge test` and `npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

### Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript**: ESLint + Prettier configuration included
- **Commits**: Conventional commits with descriptive messages

## Resources

### Documentation

- [Frontend README](frontend/README.md)
- [Smart Contracts](smart-contracts/README.md)
- [Security Audit](smart-contracts/SECURITY_AUDIT.md)
- [Setup Guide](frontend/SETUP_GUIDE.md)

### External Links

- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-6551 Token Bound Accounts](https://eips.ethereum.org/EIPS/eip-6551)
- [Foundry Book](https://book.getfoundry.sh/)
- [Privy Documentation](https://docs.privy.io/)

### Block Explorers

- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [EBTProgram Contract](https://sepolia.etherscan.io/address/0x9A7809EB76D30A754b730Dcfff1286bBff0775aa)
- [FoodStamps Token](https://sepolia.etherscan.io/token/0xd89406651698c85423e94D932bac95fA5Ab729Ec)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with irony and Solidity.
