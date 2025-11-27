# EBT Program Smart Contracts

[![Solidity](https://img.shields.io/badge/Solidity-0.8.30-blue)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C)](https://book.getfoundry.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Smart contracts for The EBT Program - an ERC-721 NFT system with ERC-6551 token-bound accounts and ERC-20 token distribution.

## Overview

The EBT Program consists of 7 main contracts that work together to create a gamified token distribution system:

| Contract | Type | Description |
|----------|------|-------------|
| `EBTProgram` | ERC-721 | Main NFT contract with minting and claims |
| `FoodStamps` | ERC-20 | $EBTC token (20B supply) |
| `ERC6551Registry` | ERC-6551 | Token Bound Account registry |
| `ERC6551Account` | ERC-6551 | TBA implementation with asset locking |
| `EBTApplication` | Custom | Application and approval management |
| `LiquidityVault` | Custom | Token distribution and vesting factory |
| `TeamVesting` | Custom | Team token vesting schedule |

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 18+ (for scripts)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/TheEBTProgram.git
cd TheEBTProgram/smart-contracts

# Install dependencies
forge install

# Build contracts
forge build
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
# PRIVATE_KEY=your_private_key
# SEPOLIA_RPC_URL=your_rpc_url
# ETHERSCAN_API_KEY=your_api_key
```

## Development

### Build

```bash
forge build
```

### Test

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-path foundry-test/unit/EBTProgram.t.sol

# Run specific test function
forge test --match-test testMintSuccess

# Run with gas report
forge test --gas-report

# Run coverage
forge coverage
```

### Format

```bash
forge fmt
```

### Local Development

```bash
# Start local node
anvil

# Deploy to local node (in another terminal)
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Contract Architecture

### User Flow

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. EBTApplication.apply4EBT(username, pic, twitter, userId)  │
│                          ↓                                      │
│   2. Admin: EBTApplication.approveUsers([userId])              │
│                          ↓                                      │
│   3. User: EBTProgram.mint(userId) + 0.02-2 ETH                │
│                          ↓                                      │
│   4. System creates:                                            │
│      - ERC-721 NFT (EBT Card)                                  │
│      - ERC-6551 TBA (Token Bound Account)                      │
│      - Distributes $EBTC tokens to TBA                         │
│                          ↓                                      │
│   5. Protocol: EBTProgram.claim(tokenId) monthly               │
│                          ↓                                      │
│   6. User: EBTProgram.reapply(tokenId) after 3 claims          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Token Distribution

```
$EBTC (20 Billion Total Supply)
├── 65% (13B) → LiquidityVault
│   ├── Mint distributions
│   ├── Monthly claim distributions
│   └── Marketing vesting contracts
├── 20% (4B)  → Marketing Wallet (TGE)
├── 10% (2B)  → EBTProgram (NFT holder airdrops)
└── 5%  (1B)  → TeamVesting (vested over 5 months)

ETH from NFT Sales
├── 65% → LiquidityVault (LP + buybacks)
├── 20% → Marketing Wallet
├── 10% → Treasury
└── 5%  → Team Wallet
```

## Contract Details

### EBTProgram.sol

The main NFT contract implementing ERC-721 with additional functionality.

**Key Functions:**

```solidity
// Mint an EBT Card NFT
function mint(string calldata userID) external payable

// Claim monthly tokens (protocol-only)
function claim(uint256 tokenId) external onlyProtocol

// Reapply for new season
function reapply(uint256 tokenId) external

// TBA locking (automatic on approval)
function approve(address to, uint256 tokenId) public override
function requestUnlock(uint256 tokenId) external
```

**Constants:**

| Parameter | Value |
|-----------|-------|
| MINT_PRICE | 0.02 ETH |
| MAX_MINT_PRICE | 2 ETH |
| SOFT_CAP | 20 ETH |
| HARD_CAP | 2,000 ETH |
| FUNDRAISING_PERIOD | 30 days |
| CLAIM_INTERVAL | 30 days |
| MAX_CLAIMS | 3 |

### FoodStamps.sol

ERC-20 token with controlled minting and pausable transfers.

**Key Functions:**

```solidity
// One-time initial distribution (owner only)
function initialDistribution(
    address _liquidityVault,
    address _teamVesting,
    address _marketingWallet,
    address _ebtProgram
) external onlyOwner

// Mint new tokens (vault or owner only)
function mint(address to, uint256 amount) external

// Pause/unpause transfers
function pause() external onlyOwner
function unpause() external onlyOwner
```

### ERC6551Account.sol

Token Bound Account implementation with asset locking for marketplace safety.

**Key Functions:**

```solidity
// Execute arbitrary calls (owner only, not when locked)
function executeCall(
    address to,
    uint256 value,
    bytes calldata data
) external payable onlyTokenOwner whenNotLocked

// Token transfers (owner only, not when locked)
function transferERC20(address token, address to, uint256 amount) external
function transferERC721(address token, address to, uint256 tokenId) external

// Lock/unlock (NFT contract only)
function lockAssets() external onlyNFTContract
function unlockAssets() external onlyNFTContract

// View functions
function token() public view returns (uint256, address, uint256)
function owner() public view returns (address)
function isLocked() public view returns (bool)
```

### LiquidityVault.sol

Manages token distributions and serves as a factory for marketing vesting contracts.

**Key Functions:**

```solidity
// Called by EBTProgram during mint
function distributeAtMint(address tba, uint256 amount) external onlyEBTProgram

// Called by EBTProgram during claim
function distributeAtClaim(address tba, uint256 amount) external onlyEBTProgram

// Create vesting contract for marketing partner
function createMarketingVesting(
    address beneficiary,
    uint256 totalAllocation,
    uint256 vestingDuration,
    bool revocable,
    string memory name,
    string memory role
) external onlyOwner

// Monthly buyback operations
function monthlyOperation(
    address swapRouter,
    uint256 ethForBuyback,
    uint256 minTokensOut
) external onlyOwner
```

## Deployment

### Deploy to Sepolia

```bash
# Set environment variables
source .env

# Deploy with verification
forge script script/Deploy.s.sol \
    --rpc-url $SEPOLIA_RPC_URL \
    --broadcast \
    --verify \
    -vvvv
```

### Deployment Script Output

The deployment script will output all contract addresses. Update `frontend/src/lib/contracts/addresses.ts` with these values.

### Post-Deployment Checklist

1. [ ] Verify all contracts on Etherscan
2. [ ] Update frontend with new addresses
3. [ ] Configure admin roles
4. [ ] Test mint flow on testnet
5. [ ] Transfer ownership to multisig (mainnet)

## Testing

### Test Structure

```
foundry-test/
├── unit/                    # Unit tests per contract
│   ├── EBTProgram.t.sol
│   ├── FoodStamps.t.sol
│   ├── ERC6551Account.t.sol
│   └── ...
├── integration/             # Full flow tests
│   └── FullUserJourney.t.sol
├── fuzz/                    # Fuzz tests
│   ├── MintFuzz.t.sol
│   └── ClaimFuzz.t.sol
└── TBALocking.t.sol         # TBA security tests (31 tests)
```

### Running Tests

```bash
# All tests
forge test

# Unit tests only
forge test --match-path "foundry-test/unit/*"

# Fuzz tests with more runs
forge test --match-contract Fuzz --fuzz-runs 1000

# With gas snapshots
forge snapshot
```

### Test Coverage

```bash
forge coverage --report lcov

# Generate HTML report (requires lcov)
genhtml -o coverage lcov.info
```

## Security

### Audit Status

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for the full audit report.

### Key Security Features

1. **Reentrancy Protection**: All state-modifying functions use `nonReentrant`
2. **Access Control**: Role-based with OpenZeppelin AccessControl
3. **TBA Asset Locking**: Automatic protection during NFT marketplace listings
4. **Initialization**: Contracts require full configuration before operation
5. **Pausable**: Emergency pause on FoodStamps token

### Known Considerations

- Block-based rate limiting (3 blocks between mints) - consider time-based for mainnet
- Protocol caller has trust assumptions for claim execution
- Merkle proofs for TGE airdrop should include deadline and chain ID for mainnet

## Gas Optimization

Estimated gas costs (Sepolia):

| Operation | Gas Used | Cost @ 20 gwei |
|-----------|----------|----------------|
| Apply | ~150,000 | ~0.003 ETH |
| Mint | ~350,000 | ~0.007 ETH |
| Claim | ~100,000 | ~0.002 ETH |
| Reapply | ~80,000 | ~0.0016 ETH |

## Events

### EBTProgram Events

```solidity
event EBTCardMinted(address indexed to, uint256 indexed tokenId, address tba, uint256 ethPaid, uint256 tokensReceived);
event BenefitsClaimed(uint256 indexed tokenId, uint256 claimNumber, uint256 amount);
event ReapplicationSubmitted(uint256 indexed tokenId);
event TBALocked(uint256 indexed tokenId, address indexed tba, address indexed approvedAddress);
event TBAUnlocked(uint256 indexed tokenId, address indexed tba);
```

### FoodStamps Events

```solidity
event InitialDistributionCompleted(address liquidityVault, address teamVesting, address marketingWallet, address ebtProgram);
event FoodStampsMinted(address indexed to, uint256 amount);
```

## Upgradeability

The current contracts are **not upgradeable**. For mainnet, consider:

1. Proxy pattern (UUPS or Transparent) for critical contracts
2. Timelocked admin functions
3. Multisig ownership

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-6551 Token Bound Accounts](https://eips.ethereum.org/EIPS/eip-6551)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Solidity Documentation](https://docs.soliditylang.org/)

## License

MIT License - see [LICENSE](../LICENSE) for details.
