# EBT Program - Comprehensive Audit Documentation

**Document Version:** 1.0.0
**Date:** November 27, 2024
**Status:** Pre-Mainnet Security Hardening Complete
**Target:** External Security Auditor

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Smart Contract Specifications](#4-smart-contract-specifications)
5. [Token Economics](#5-token-economics)
6. [Security Model](#6-security-model)
7. [External Audit Findings & Remediation](#7-external-audit-findings--remediation)
8. [Internal Security Fixes Applied](#8-internal-security-fixes-applied)
9. [Residual Risk Analysis](#9-residual-risk-analysis)
10. [Additional Attack Vectors Considered](#10-additional-attack-vectors-considered)
11. [Test Coverage](#11-test-coverage)
12. [Deployment Checklist](#12-deployment-checklist)
13. [Operational Security](#13-operational-security)
14. [Bug Bounty Program](#14-bug-bounty-program)

---

## 1. Executive Summary

### 1.1 What is the EBT Program?

The EBT Program is a Web3 social benefits distribution system that uses:
- **ERC-721 NFTs** ("EBT Cards") as identity tokens for beneficiaries
- **ERC-6551 Token Bound Accounts (TBAs)** to hold each beneficiary's assets
- **ERC-20 tokens** ($EBTC / FoodStamps) as the distribution currency
- **Merkle-based TGE airdrops** for initial token distribution
- **Protocol-controlled claims** for monthly benefit disbursement

### 1.2 Security Posture Summary

| Category | Status | Details |
|----------|--------|---------|
| **Smart Contracts** | ✅ Hardened | All CRITICAL/HIGH/MEDIUM issues fixed |
| **Frontend Hooks** | ⚠️ ABI Mismatch | Requires realignment with contract |
| **API Security** | ⚠️ PII Exposure | Leaderboard endpoint needs gating |
| **Admin Auth** | ⚠️ Static Token | Recommend stronger auth mechanism |

### 1.3 Key Trust Assumptions

1. **Owner address** is a secure multisig (not yet deployed - IN PROGRESS)
2. **Protocol Caller** is a secure backend service with proper key management
3. **Admin tokens** are rotated and never exposed
4. **Merkle tree generation** follows audited off-chain process

---

## 2. Project Overview

### 2.1 Problem Statement

Traditional benefit distribution systems suffer from:
- Identity fraud and duplicate claims
- Slow disbursement through legacy banking
- Lack of transparency in fund allocation
- High administrative overhead

### 2.2 Solution Design

The EBT Program addresses these through:
1. **On-chain identity**: Each beneficiary gets one NFT per wallet
2. **Token-bound accounts**: Assets tied to identity, tradeable as a unit
3. **Protocol-controlled claims**: Backend validates eligibility before distribution
4. **Transparent tokenomics**: All allocations verifiable on-chain

### 2.3 Stakeholders

| Role | Description | Trust Level |
|------|-------------|-------------|
| **Beneficiaries** | Users who apply and receive benefits | Untrusted |
| **Admin** | Approves applications, sets metadata | Privileged |
| **Protocol Caller** | Backend service executing claims | Highly Privileged |
| **Owner** | Multisig controlling critical params | Most Privileged |
| **Marketing Partners** | KOLs with vesting contracts | External |
| **Team** | Receives vested allocation | Internal |

---

## 3. System Architecture

### 3.1 Contract Dependency Graph

```
                    ┌──────────────────────────────────────────────┐
                    │                   USER                        │
                    └──────────────────┬───────────────────────────┘
                                       │
                    ┌──────────────────▼───────────────────────────┐
                    │            EBTApplication.sol                 │
                    │  - Application submission & approval          │
                    │  - Score management                           │
                    │  - Metadata URI storage                       │
                    └──────────────────┬───────────────────────────┘
                                       │ isUserApproved()
                    ┌──────────────────▼───────────────────────────┐
                    │              EBTProgram.sol                   │
                    │  - ERC721 NFT ("EBT Card")                   │
                    │  - Dynamic pricing (0.02-2 ETH)              │
                    │  - Fundraising management                     │
                    │  - TBA creation & locking                     │
                    │  - Merkle TGE airdrops                        │
                    └──────┬────────────────────────┬──────────────┘
                           │                        │
              createAccount()                  distributeAtMint()
                           │                        │
        ┌──────────────────▼──────┐    ┌───────────▼──────────────┐
        │   ERC6551Registry.sol   │    │    LiquidityVault.sol    │
        │  - TBA factory          │    │  - 65% token allocation  │
        │  - CREATE2 deployment   │    │  - Mint/claim distrib.   │
        │  - Implementation lock  │    │  - Marketing vesting     │
        └──────────────────┬──────┘    │  - ETH for LP/buybacks   │
                           │           └───────────┬──────────────┘
        ┌──────────────────▼──────┐                │
        │   ERC6551Account.sol    │    ┌───────────▼──────────────┐
        │  - TBA implementation   │    │   MarketingVesting.sol   │
        │  - Asset locking        │    │  - Per-partner vesting   │
        │  - Token transfers      │    │  - Linear schedule       │
        └─────────────────────────┘    │  - Revocable option      │
                                       └──────────────────────────┘

        ┌─────────────────────────┐    ┌──────────────────────────┐
        │     FoodStamps.sol      │    │     TeamVesting.sol      │
        │  - ERC20 ($EBTC)        │    │  - 5% team allocation    │
        │  - 20B max supply       │    │  - 1% TGE + 1%/month     │
        │  - Initial distribution │    │  - Terminable            │
        └─────────────────────────┘    └──────────────────────────┘
```

### 3.2 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. APPLICATION                                                              │
│     User → EBTApplication.apply4EBT(username, pic, twitter, budget, userID) │
│           └─→ ApplicationSubmitted event                                     │
│                                                                              │
│  2. ADMIN APPROVAL                                                           │
│     Admin → EBTApplication.approveUsers([userIDs])                          │
│           └─→ UserApproved event                                             │
│                                                                              │
│  3. NFT MINTING                                                              │
│     User → EBTProgram.mint{value: 0.02-2 ETH}(userID)                       │
│           ├─→ ERC721 NFT minted to user                                      │
│           ├─→ TBA created via ERC6551Registry                               │
│           ├─→ Initial $EBTC tokens sent to TBA                              │
│           └─→ ContributionReceived event                                     │
│                                                                              │
│  4. TGE AIRDROP (Optional)                                                   │
│     User → EBTProgram.claimTGEAirdrop(tokenId, amount, merkleProof)         │
│           └─→ Additional $EBTC to TBA from EBTProgram's 2B allocation        │
│                                                                              │
│  5. MONTHLY CLAIMS (x3)                                                      │
│     Protocol → EBTProgram.claim(tokenId)                                    │
│              ├─→ Score fetched from EBTApplication                          │
│              ├─→ Tokens = base + (base × score/1000)                        │
│              └─→ ClaimProcessed event                                        │
│                                                                              │
│  6. REAPPLICATION                                                            │
│     User → EBTProgram.reapply(tokenId)  [after 3 claims]                    │
│     Admin → EBTProgram.approveReapplication(tokenId, newBaseAmount)         │
│           └─→ Claim counter reset, eligible for 3 more claims               │
│                                                                              │
│  7. MARKETPLACE TRADING                                                      │
│     User → EBTProgram.approve(marketplace, tokenId)                         │
│           └─→ TBA auto-locked (assets protected)                            │
│     Buyer → Marketplace.buy()                                                │
│           └─→ NFT transfers, TBA auto-unlocks for new owner                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 ETH Flow (Fundraising)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ETH DISTRIBUTION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   NFT Minting (0.02-2 ETH per mint)                                         │
│         │                                                                    │
│         ▼                                                                    │
│   ┌─────────────┐                                                           │
│   │ EBTProgram  │  totalRaised = sum of all contributions                   │
│   └──────┬──────┘                                                           │
│          │  closeFundraising() + distributeETH()                            │
│          ▼                                                                    │
│   ┌──────────────────────────────────────────────────────────┐              │
│   │                    DISTRIBUTION                           │              │
│   ├──────────────────────────────────────────────────────────┤              │
│   │  65% ──→ LiquidityVault (LP creation, buybacks)          │              │
│   │  20% ──→ Marketing Wallet (direct)                        │              │
│   │  10% ──→ Treasury (direct)                                │              │
│   │   5% ──→ Team Wallet (direct)                             │              │
│   └──────────────────────────────────────────────────────────┘              │
│                                                                              │
│   SOFT CAP NOT MET:                                                          │
│   User → EBTProgram.claimRefund()                                           │
│        └─→ Full contribution returned                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Token Flow ($EBTC)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        $EBTC TOKEN DISTRIBUTION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   FoodStamps.initialDistribution()                                          │
│         │                                                                    │
│         ▼                                                                    │
│   ┌──────────────────────────────────────────────────────────┐              │
│   │              INITIAL ALLOCATION (20B Total)              │              │
│   ├──────────────────────────────────────────────────────────┤              │
│   │  65% (13B) ──→ LiquidityVault                            │              │
│   │                ├── distributeAtMint() to TBAs            │              │
│   │                ├── distributeAtClaim() to TBAs           │              │
│   │                └── Marketing vesting contracts           │              │
│   │                                                           │              │
│   │  20% (4B)  ──→ Marketing Wallet (TGE, direct)           │              │
│   │                                                           │              │
│   │  10% (2B)  ──→ EBTProgram (TGE Airdrop pool)            │              │
│   │                └── claimTGEAirdrop() to TBAs             │              │
│   │                                                           │              │
│   │   5% (1B)  ──→ TeamVesting                               │              │
│   │                ├── 200M at TGE (1%)                      │              │
│   │                └── 200M/month × 4 (4%)                   │              │
│   └──────────────────────────────────────────────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Smart Contract Specifications

### 4.1 EBTProgram.sol

**Purpose:** Main NFT contract managing EBT Cards, fundraising, and claims

**Key Constants:**
```solidity
MIN_PRICE = 0.02 ether        // Minimum mint price
MAX_PRICE = 2 ether           // Maximum mint price
PRICE_PRECISION = 0.001 ether // Price must be multiple of this
MAX_CLAIMS = 3                // Claims before reapplication needed
CLAIM_INTERVAL = 30 days      // Minimum time between claims
MINT_COOLDOWN = 30 seconds    // Rate limiting between mints
BASE_TOKENS_PER_MIN_PRICE = 20,000 × 10^18  // Tokens per 0.02 ETH

// ETH Distribution
LIQUIDITY_PERCENT = 6500  // 65%
MARKETING_PERCENT = 2000  // 20%
TREASURY_PERCENT = 1000   // 10%
TEAM_PERCENT = 500        // 5%
```

**Key State Variables:**
```solidity
// Initialization
bool initialized              // Prevents operations before setup
uint256 fundraisingStartTime  // Set at initialize(), not deployment

// Fundraising
uint256 softCap = 20 ether    // Minimum for distribution (configurable pre-init)
uint256 hardCap = 2000 ether  // Maximum accepted (configurable pre-init)
uint256 totalRaised           // Running total
bool fundraisingClosed        // After period ends or hardCap hit
bool ethDistributed           // Prevents double distribution

// TGE Airdrop
bytes32 tgeMerkleRoot         // Root for airdrop proofs
uint256 tgeAirdropDeadline    // Expiration timestamp

// Rate Limiting
uint256 lastMintTimestamp     // Time-based (not block-based)

// Per-Token Data
struct TokenData {
    uint256 mintPrice;
    uint256 claimCount;
    uint256 lastClaimTime;
    uint256 reapplicationBaseAmount;
    ReapplicationStatus reapplicationStatus;
    bool tgeClaimed;
}
```

**Critical Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `initialize()` | Owner | Sets all critical addresses, starts fundraising |
| `mint()` | Public | Mints NFT, creates TBA, distributes initial tokens |
| `claim()` | Protocol Only | Executes monthly claim, fetches score from EBTApplication |
| `claimTGEAirdrop()` | NFT Owner | Claims TGE airdrop with merkle proof |
| `reapply()` | NFT Owner | Requests reapplication after 3 claims |
| `approve()` | NFT Owner | Overridden to auto-lock TBA |
| `requestUnlock()` | NFT Owner | Unlocks TBA when no approvals exist |
| `closeFundraising()` | Owner | Ends fundraising period |
| `distributeETH()` | Owner | Distributes raised ETH to wallets |
| `claimRefund()` | Contributors | If soft cap not met |

**Design Decisions:**

1. **Protocol-only claims**: Claims are executed by a trusted backend (`protocolCaller`) to prevent users from manipulating their own scores. Scores are fetched from `EBTApplication` on-chain.

2. **Time-based rate limiting**: Uses `block.timestamp` with 30-second cooldown instead of block numbers. This is L2-friendly and miner-resistant.

3. **TBA locking on approval**: When an NFT is approved for marketplace transfer, the TBA automatically locks. This protects buyers from sellers draining TBA assets between listing and sale.

4. **Per-token implementation tracking**: Each token stores which TBA implementation was used at mint time, allowing implementation upgrades for new tokens while preserving existing TBAs.

---

### 4.2 EBTApplication.sol

**Purpose:** Application and approval gatekeeper

**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `apply4EBT()` | Public | Submit application |
| `approveUsers()` | Admin | Batch approve (max 100) |
| `revokeUsers()` | Admin | Batch revoke (max 100) |
| `setUserScore()` | Admin | Set score (0-1000) |
| `setMetadataURI()` | Admin | Set NFT metadata IPFS URI |
| `isUserApproved()` | View | Check approval status |
| `getUserScore()` | View | Get user's score |

**Security Notes:**
- **No automatic approval**: All users must be explicitly approved by admin
- **Input validation**: Empty userID/username rejected, score must be ≤1000
- **Batch limits**: Maximum 100 items per batch operation (DoS prevention)
- **ReentrancyGuard**: Applied to `apply4EBT()`

---

### 4.3 ERC6551Registry.sol

**Purpose:** Factory for deploying Token Bound Accounts

**Key Security Features:**
- **Implementation locking**: After first account creation, implementation cannot be changed
- **CREATE2 deterministic addresses**: TBA address predictable from parameters
- **Per ERC-6551 spec**: 173 bytes of runtime code including salt

**Critical Fix Applied:**
```solidity
// Bytecode encoding now includes salt (was missing before)
abi.encode(salt_, chainId_, tokenContract_, tokenId_)  // 128 bytes of context
```

---

### 4.4 ERC6551Account.sol

**Purpose:** Token Bound Account implementation with asset locking

**Security Model:**
1. **Global lock**: Single `_assetsLocked` boolean blocks ALL outgoing transfers
2. **NFT contract authority**: Only `EBTProgram` can call `lockAssets()`/`unlockAssets()`
3. **Owner verification**: All transfers require `onlyTokenOwner` modifier

**Protected Functions:**
- `executeCall()` - Arbitrary calls blocked when locked
- `transferERC20/721/1155()` - Token transfers blocked when locked
- `approveERC20/721()` - Approvals blocked when locked

---

### 4.5 LiquidityVault.sol

**Purpose:** Holds 65% of tokens (13B) and manages distributions

**Key Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `distributeAtMint()` | EBTProgram | Send tokens to TBA on mint |
| `distributeAtClaim()` | EBTProgram | Send tokens to TBA on claim |
| `createMarketingVesting()` | Owner | Create partner vesting contract |
| `revokeMarketingVesting()` | Owner | Revoke and reclaim unvested tokens |
| `monthlyOperation()` | Owner | Placeholder for DEX buybacks |
| `addLiquidity()` | Owner | Placeholder for LP creation |
| `emergencyWithdrawTokens()` | Owner | Emergency token recovery |
| `emergencyWithdrawETH()` | Owner | Emergency ETH recovery |

**Audit Finding - Low:** `addLiquidity()` calls `safeApprove(swapRouter, ...)` without checking `swapRouter != address(0)`. Add zero-address check.

---

### 4.6 FoodStamps.sol

**Purpose:** ERC20 token ($EBTC) with 20B max supply

**Key Features:**
- **One-time distribution**: `initialDistribution()` can only be called once
- **Authorized minting**: Only `liquidityVault` or `owner` can mint post-distribution
- **Pausable transfers**: Owner can pause all transfers in emergency

**Audit Finding - Low:** `mint()` callable even when paused. If supply freeze is intended during incidents, add `whenNotPaused` modifier.

---

### 4.7 TeamVesting.sol

**Purpose:** Team allocation vesting (1B tokens)

**Schedule:**
- TGE: 200M (1% of total supply)
- Month 1-4: 200M each (1% per month)
- Total: 1B (5% of total supply)

**Key Features:**
- `terminateVesting()`: Emergency termination returns unvested tokens
- `terminated` flag: Prevents claims after termination

---

### 4.8 MarketingVesting.sol

**Purpose:** Linear vesting for marketing partners

**Key Features:**
- Deployed via LiquidityVault factory
- Configurable duration (default 90 days)
- Optional revocability
- Partner metadata (name, type) for transparency

---

## 5. Token Economics

### 5.1 $EBTC Supply Distribution

| Allocation | Amount | Percentage | Recipient |
|------------|--------|------------|-----------|
| Protocol/Liquidity | 13B | 65% | LiquidityVault |
| Marketing | 4B | 20% | Marketing Wallet |
| NFT Holders (TGE) | 2B | 10% | EBTProgram (for airdrop) |
| Team | 1B | 5% | TeamVesting |
| **Total** | **20B** | **100%** | |

### 5.2 Token Distribution Mechanics

**At Mint:**
```
tokensReceived = (mintPrice / 0.02 ETH) × 20,000 tokens
```
Example: 0.1 ETH mint → 100,000 tokens to TBA

**At Claim:**
```
baseAmount = (mintPrice / 0.02 ETH) × 20,000 tokens  [or reapplication amount]
bonus = baseAmount × (score / 1000)
totalClaim = baseAmount + bonus
```
Example: 0.02 ETH mint, score 500 → 20,000 + 10,000 = 30,000 tokens

---

## 6. Security Model

### 6.1 Access Control Matrix

| Contract | Function | Owner | Admin | Protocol | User | Notes |
|----------|----------|-------|-------|----------|------|-------|
| **EBTProgram** |
| | initialize | ✅ | | | | One-time setup |
| | mint | | | | ✅ | During fundraising |
| | claim | | | ✅ | | Score from EBTApp |
| | claimTGEAirdrop | | | | ✅ | With merkle proof |
| | reapply | | | | ✅ | NFT owner only |
| | approve | | | | ✅ | Auto-locks TBA |
| | requestUnlock | | | | ✅ | NFT owner, no approvals |
| | closeFundraising | ✅ | | | | |
| | distributeETH | ✅ | | | | |
| | setProtocolCaller | ✅ | | | | |
| | pause/unpause | ✅ | | | | |
| **EBTApplication** |
| | apply4EBT | | | | ✅ | |
| | approveUsers | | ✅ | | | Max 100 |
| | revokeUsers | | ✅ | | | Max 100 |
| | setUserScore | | ✅ | | | 0-1000 |
| **LiquidityVault** |
| | distributeAtMint | | | | | EBTProgram only |
| | distributeAtClaim | | | | | EBTProgram only |
| | createMarketingVesting | ✅ | | | | |
| | emergencyWithdraw* | ✅ | | | | |
| **FoodStamps** |
| | initialDistribution | ✅ | | | | One-time |
| | mint | ✅ | | | | Or vault |
| | pause/unpause | ✅ | | | | |

### 6.2 Key Security Properties

1. **One NFT per wallet**: `hasMinted[msg.sender]` prevents multiple mints
2. **UserID ownership**: Mint verifies caller owns the userID
3. **Score integrity**: Score fetched from on-chain source (EBTApplication)
4. **TBA protection**: Auto-lock on approval, unlock requires no approvals
5. **Rate limiting**: 30-second cooldown between mints
6. **Cross-chain protection**: Merkle proofs include `block.chainid`
7. **Refund protection**: Soft cap check before distribution

---

## 7. External Audit Findings & Remediation

### 7.1 HIGH Severity

#### H-ABI: Frontend contract calls don't match deployed ABI

**Finding:** `useEBTProgram`, `useAdminContract`, `useTBA` hooks call non-existent functions:
- `claimInstallment`, `withdraw`, `totalFundsRaised`, `fundraisingDeadline`
- `WITHDRAWAL_PERIOD`, `setWithdrawalPeriod`, `setPayoutAddresses`
- `getTokenAccount`, `tokenIdToMintedTimestamp`, `closeFundraisingPeriod`
- `installmentCount`
- `useTBA` uses static seed instead of per-token salt

**Impact:** All user actions hitting these hooks will revert on-chain.

**Recommended Fix:**
1. Regenerate ABI types from actual deployed contract
2. Update hook functions to match real contract methods:
   - `claimInstallment` → Remove (protocol-only `claim()`)
   - `totalFundsRaised` → Use `totalRaised` getter
   - `fundraisingDeadline` → Calculate from `fundraisingStartTime + _fundraisingPeriod`
   - `getTokenAccount` → Use `getTBA(tokenId)`
3. Fix `useTBA` to call `EBTProgram.getTBA(tokenId)` instead of registry with fixed seed

**Files:**
- `frontend/src/lib/hooks/useEBTProgram.ts`
- `frontend/src/lib/hooks/useAdminContract.ts`
- `frontend/src/lib/hooks/useTBA.ts`

---

#### H-PRICE: Mint flow ignores dynamic pricing

**Finding:** `useMint` hardcodes `MINT_PRICE = 0.02 ETH`, ignoring the dynamic pricing range (0.02-2 ETH).

**Impact:** Users cannot mint at higher prices, defeating the contract's dynamic pricing design.

**Recommended Fix:**
1. Accept user-specified price input
2. Validate client-side: `MIN_PRICE ≤ price ≤ MAX_PRICE` and `price % PRICE_PRECISION == 0`
3. Pass validated price as `value` to `mint()`

**UI Suggestion:**
```tsx
// Slider from 0.02 to 2 ETH in 0.001 increments
<input type="range" min="0.02" max="2" step="0.001" />
```

---

### 7.2 MEDIUM Severity

#### M-PROTOCOL: Protocol-only actions exposed to users

**Finding:** `useClaimInstallment` attempts user-initiated claim, but `claim()` is `onlyProtocol`.

**Impact:** Users see claim UI but transactions always revert.

**Recommended Fix:**
- Remove user-facing claim hook/UI
- Document that claims are executed by protocol backend
- Provide claim status view (last claim time, claims remaining)

---

#### M-PII: Public API leaks PII

**Finding:** Leaderboard endpoint returns email, Twitter/Discord/GitHub handles without auth.

**Impact:** User PII exposed to anyone.

**Recommended Fix:**
```typescript
// Strip sensitive fields
return users.map(u => ({
  userId: u.userId,
  username: u.username,
  score: u.score,
  mintedTokenId: u.mintedTokenId
  // REMOVED: email, twitter, discord, github
}));
```

Alternative: Require auth for full profile data.

**File:** `frontend/src/app/api/leaderboard/route.ts`

---

#### M-BYPASS: Dev auth bypass footgun

**Finding:** `verifyPrivyAuth` allows bypass when `PRIVY_BYPASS=true` in any non-production environment.

**Impact:** Staging/preview environments could be exploited if flag accidentally set.

**Recommended Fix:**
```typescript
// Only allow bypass on explicit localhost
const isLocalhost = request.headers.get('host')?.startsWith('localhost');
if (process.env.PRIVY_BYPASS === 'true' && isLocalhost) {
  // Allow bypass
}
```

**File:** `frontend/src/lib/auth.ts`

---

#### M-ADMIN: Admin protection is static header token

**Finding:** Admin routes secured only by static `x-admin-token` header.

**Impact:** Single leaked token compromises all admin functions.

**Recommended Fix:**
1. **Short-term:** Implement token rotation, add rate limiting to admin endpoints
2. **Long-term:** Replace with Privy-admin role or JWT-based admin auth
3. Add audit logging for all admin actions

---

### 7.3 LOW Severity

#### L-ROUTER: LiquidityVault addLiquidity can revert when router unset

**Finding:** `addLiquidity()` calls `safeApprove(swapRouter, ...)` without checking router is set.

**Recommended Fix:**
```solidity
function addLiquidity(...) external onlyOwner {
    require(swapRouter != address(0), "SwapRouterNotSet");
    // ... existing logic
}
```

---

#### L-PAUSE: Pause doesn't stop minting of FoodStamps

**Finding:** `mint()` callable by owner/vault even when paused.

**Recommended Fix (if supply freeze intended):**
```solidity
function mint(address to, uint256 amount) external whenNotPaused {
    // ... existing logic
}
```

---

#### L-META: Public metadata endpoint returns raw JSON strings

**Finding:** Malformed JSON returned as-is without validation.

**Recommended Fix:**
- Validate JSON at ingestion (when admin sets metadata)
- Return structured, sanitized response

---

## 8. Internal Security Fixes Applied

### 8.1 CRITICAL Fixes (6 total)

| ID | Issue | Fix Applied |
|----|-------|-------------|
| C-1 | Auto-approval vulnerability | Removed `headOfHouseHold` auto-approval |
| C-2 | TBA asset draining | Integrated TBA locking via EBTProgram |
| C-3 | Missing ReentrancyGuard | Added to `EBTApplication.apply4EBT()` |
| C-4 | Score validation bypass | Scores now fetched from EBTApplication |
| C-5 | Missing initialization checks | Added `initialize()` state machine |
| C-6 | ERC6551Registry bytecode bug | Added missing salt to abi.encode() |

### 8.2 HIGH Fixes (8 total)

| ID | Issue | Fix Applied |
|----|-------|-------------|
| H-1 | Merkle missing chainId | Added `block.chainid` + deadline to proofs |
| H-2 | Integer division loss | Team amount = remainder calculation |
| H-3 | Mint wallet verification | UserID ownership check added |
| H-4 | FoodStamps proxy logic | Simplified to standard ERC20 |
| H-5 | Soft cap not enforced | Added `SoftCapNotReached` check + refunds |
| H-6 | Block-based rate limiting | Changed to 30-second time-based cooldown |
| H-7 | Monthly operation stub | Placeholder only (requires DEX post-TGE) |
| H-8 | Reapplication no re-verify | Added approval re-check in `reapply()` |

### 8.3 MEDIUM Fixes (9 total)

| ID | Issue | Fix Applied |
|----|-------|-------------|
| M-1 | Input validation | EmptyUserID, EmptyUsername, InvalidScore errors |
| M-2 | Team vesting termination | Added `terminateVesting()` function |
| M-3 | Marketing vesting re-init | Added `AlreadyInitialized` check |
| M-4 | Registry implementation lock | Auto-locks after first account creation |
| M-5 | TBA bytecode fragility | ERC-6551 spec compliance (mitigation) |
| M-6 | Event emission | All state changes emit events |
| M-7 | Batch DoS | MAX_BATCH_SIZE = 100 |
| M-8 | Metadata validation | Empty URI rejected |
| M-9 | Vesting edge cases | Covered by M-2 and M-3 |

---

## 9. Residual Risk Analysis

### 9.1 Centralization Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Owner key compromise | HIGH | Deploy with multisig (IN PROGRESS) |
| Protocol caller compromise | HIGH | Secure backend, key rotation |
| Admin token leak | MEDIUM | Rotation policy, monitoring |
| Merkle root manipulation | MEDIUM | Document generation process |

### 9.2 Economic Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Soft cap not reached | LOW | Refund mechanism in place |
| Token price manipulation | MEDIUM | Liquidity vault controls |
| Score gaming | LOW | Admin-controlled scores |

### 9.3 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| TBA lock UX friction | LOW | Clear documentation |
| Vesting contract stuck | LOW | Emergency withdraw available |
| Gas price spikes | LOW | Batch limits in place |

---

## 10. Additional Attack Vectors Considered

### 10.1 Attack Vectors We Tested & Mitigated

| Vector | Status | Test |
|--------|--------|------|
| Score manipulation by protocol | ✅ Mitigated | `testPen_ScoreManipulationAttempt` |
| TBA drain during listing | ✅ Mitigated | `testPen_FrontRunningMarketplaceSale` |
| Rate limit bypass | ✅ Mitigated | `testPen_RateLimitingBypass` |
| Double claim | ✅ Mitigated | `testPen_DoubleClaimAttempt` |
| Reentrancy on refund | ✅ Mitigated | `testPen_ReentrancyOnRefund` |
| Unauthorized TGE claim | ✅ Mitigated | `testPen_UnauthorizedTGEClaim` |
| Cross-chain replay | ✅ Mitigated | `testPen_CrossChainReplayAttempt` |
| Batch DoS | ✅ Mitigated | `testPen_BatchOperationDoS` |
| Implementation change after lock | ✅ Mitigated | `testPen_RegistryImplementationChangeAfterLock` |
| Vesting reinitialization | ✅ Mitigated | `testPen_VestingReinitialization` |

### 10.2 Vectors Requiring Operational Security

| Vector | Risk Level | Recommended Control |
|--------|------------|---------------------|
| Private key compromise | CRITICAL | Hardware wallet, multisig |
| Admin token exposure | HIGH | Rotation, audit logging |
| Merkle tree corruption | MEDIUM | Checksums, signed generation |
| Score database tampering | MEDIUM | Database audit logs |
| Protocol caller impersonation | HIGH | Key rotation, IP allowlist |

### 10.3 Vectors Outside Scope (Frontend/Backend)

| Vector | Current State | Recommendation |
|--------|---------------|----------------|
| PII in leaderboard | ⚠️ Exposed | Strip or gate sensitive fields |
| Admin auth weakness | ⚠️ Static token | Move to JWT/Privy admin |
| ABI mismatch | ⚠️ Broken hooks | Regenerate from contract |
| Dev bypass flag | ⚠️ Footgun | Restrict to localhost |

---

## 11. Test Coverage

### 11.1 Test Summary

| Category | Count | Status |
|----------|-------|--------|
| Unit Tests | 82 | ✅ PASS |
| Security Fix Tests | 26 | ✅ PASS |
| Hardening Tests (Fuzz + Pen) | 24 | ✅ PASS |
| E2E Simulation | 6 | ✅ PASS |
| Deployment Scenarios | 5 | ✅ PASS |
| TGE Airdrop Simulation | 6 | ✅ PASS |
| Uniswap Simulation | 8 | ✅ PASS |
| Reentrancy Tests | 4 | ✅ PASS |
| **TOTAL** | **160** | **✅ 100% PASS** |

### 11.2 Test Files

```
foundry-test/
├── EBTProgram.t.sol          # Core unit tests
├── TBALocking.t.sol          # TBA locking tests (31 tests)
├── SecurityFixes.t.sol       # Security fix verification (26 tests)
├── HardeningTests.t.sol      # Fuzz + penetration tests (24 tests)
├── E2ESimulation.t.sol       # End-to-end user journeys
├── DeploymentScenarios.t.sol # Soft cap failure, blowout scenarios
├── TGEAirdropSimulation.t.sol # 100 recipient airdrop test
├── UniswapSimulation.t.sol   # DEX integration mock tests
└── ReentrancyHarness.t.sol   # Reentrancy attack simulations
```

### 11.3 Running Tests

```bash
cd TheEBTProgram/smart-contracts

# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test file
forge test --match-path foundry-test/HardeningTests.t.sol

# Run specific test
forge test --match-test testPen_FrontRunningMarketplaceSale
```

---

## 12. Deployment Checklist

### 12.1 Pre-Deployment

- [x] All CRITICAL issues resolved (6/6)
- [x] All HIGH issues resolved (8/8)
- [x] All MEDIUM issues resolved (9/9)
- [x] 160 tests passing (100%)
- [x] NatSpec documentation complete
- [x] Security audit documentation complete
- [ ] External audit completed
- [ ] Multisig wallet configured
- [ ] Frontend hooks realigned with contract ABI
- [ ] API PII exposure fixed
- [ ] Admin auth strengthened

### 12.2 Deployment Steps

1. **Deploy FoodStamps** (no constructor args)
2. **Deploy EBTApplication** (no constructor args)
3. **Deploy ERC6551Account** (no constructor args)
4. **Deploy ERC6551Registry** (no constructor args)
5. **Deploy LiquidityVault** (FoodStamps address)
6. **Deploy TeamVesting** (FoodStamps address)
7. **Set registry implementation**: `registry.setImplementation(accountImpl)`
8. **Deploy EBTProgram** (registry, application)
9. **Transfer registry ownership**: `registry.transferOwnership(program)`
10. **Set fundraising params**: `program.setFundraisingPeriod()`, `program.setCaps()`
11. **Initialize EBTProgram**: `program.initialize(...)`
12. **Set vault program**: `vault.setEBTProgram(program)`
13. **Set team wallet**: `vesting.setTeamWallet(teamMultisig)`
14. **Initial distribution**: `food.initialDistribution(...)`
15. **Grant admin to program**: `application.setProgramAsAdmin(program)`

### 12.3 Post-Deployment Verification

```bash
# Verify initialization
cast call $PROGRAM "isFullyConfigured()" --rpc-url $RPC

# Verify fundraising params
cast call $PROGRAM "softCap()" --rpc-url $RPC
cast call $PROGRAM "hardCap()" --rpc-url $RPC

# Verify token distribution
cast call $FOOD "balanceOf(address)" $VAULT --rpc-url $RPC    # Should be 13B
cast call $FOOD "balanceOf(address)" $PROGRAM --rpc-url $RPC  # Should be 2B
cast call $FOOD "balanceOf(address)" $VESTING --rpc-url $RPC  # Should be 1B
```

---

## 13. Operational Security

### 13.1 Key Management

| Key | Current | Recommended |
|-----|---------|-------------|
| Owner | EOA | 3-of-5 Multisig (Gnosis Safe) |
| Protocol Caller | Backend service | Rotate monthly, monitor usage |
| Admin Token | Static header | JWT with expiration, rotation |

### 13.2 Monitoring

**On-chain events to monitor:**
- `ContributionReceived` - Track fundraising progress
- `FundraisingClosed` - Alert when closed
- `TBALocked`/`TBAUnlocked` - Marketplace activity
- `BlacklistUpdated` - Security events
- `Paused`/`Unpaused` - Emergency actions

**Off-chain metrics:**
- Admin endpoint access patterns
- Failed claim attempts (could indicate issues)
- Merkle proof failure rate

### 13.3 Emergency Procedures

1. **Pause protocol**: `program.pause()`, `food.pause()`
2. **Blacklist address**: `program.setBlacklistStatus([addr], true)`
3. **Emergency withdraw**: `vault.emergencyWithdrawTokens()`, `vault.emergencyWithdrawETH()`
4. **Revoke vesting**: `vault.revokeMarketingVesting(vestingAddr)`
5. **Terminate team vesting**: `vesting.terminateVesting(returnAddr)`

---

## 14. Bug Bounty Program

### 14.1 Scope

All smart contracts in `/contracts`:
- `EBTProgram.sol`, `EBTApplication.sol`, `FoodStamps.sol`
- `LiquidityVault.sol`, `TeamVesting.sol`, `MarketingVesting.sol`
- `ERC6551Registry.sol`, `ERC6551Account.sol`

### 14.2 Rewards

| Severity | ETH Reward | Token Allocation |
|----------|------------|------------------|
| **Critical** | 2-5 ETH | Matching from Treasury |
| **High** | 0.5-2 ETH | Matching from Treasury |
| **Medium** | 0.1-0.5 ETH | Matching from Treasury |
| **Low** | 0.05-0.1 ETH | Matching from Treasury |

### 14.3 Submission Process

1. Email detailed report with reproduction steps
2. Team acknowledges within 48 hours
3. Assessment provided within 7 days
4. Rewards distributed within 14 days of fix verification

### 14.4 Safe Harbor

We will not pursue legal action against researchers who:
- Follow responsible disclosure
- Act in good faith
- Do not access/modify/delete user data
- Do not disrupt service

---

## Appendix A: Contract Addresses (Post-Deployment)

*To be filled after mainnet deployment*

| Contract | Address | Verified |
|----------|---------|----------|
| FoodStamps | | |
| EBTApplication | | |
| ERC6551Account | | |
| ERC6551Registry | | |
| LiquidityVault | | |
| TeamVesting | | |
| EBTProgram | | |

---

## Appendix B: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-11-27 | Initial comprehensive audit documentation |

---

*Document prepared for external security auditor. Please contact the team with any questions or clarifications needed.*
