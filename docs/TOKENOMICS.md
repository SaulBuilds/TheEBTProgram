# EBT Program Tokenomics

This document provides a comprehensive overview of the tokenomics for The EBT Program, including token distribution, fundraising mechanics, and economic incentives.

## Table of Contents

- [Overview](#overview)
- [Token Details](#token-details)
- [Initial Token Distribution](#initial-token-distribution)
- [ETH Distribution from NFT Sales](#eth-distribution-from-nft-sales)
- [Fundraising Mechanics](#fundraising-mechanics)
- [Token Utility](#token-utility)
- [Vesting Schedules](#vesting-schedules)
- [Economic Model](#economic-model)
- [Contract Addresses](#contract-addresses)

## Overview

The EBT Program uses a dual-token system:

1. **EBT Card NFT (SNAP)** - ERC-721 NFTs representing membership
2. **FoodStamps ($EBTC)** - ERC-20 utility token distributed to NFT holders

## Token Details

### FoodStamps ($EBTC)

| Property | Value |
|----------|-------|
| Name | FoodStamps |
| Symbol | EBTC |
| Decimals | 18 |
| Max Supply | 20,000,000,000 (20 Billion) |
| Type | ERC-20 |
| Mintable | Yes (controlled) |
| Burnable | No |
| Pausable | Yes (emergency) |

### EBT Card NFT (SNAP)

| Property | Value |
|----------|-------|
| Name | The EBT Program |
| Symbol | SNAP |
| Type | ERC-721 |
| Max Supply | Unlimited (soft-capped by fundraising) |
| Features | ERC-6551 Token Bound Account |

## Initial Token Distribution

The 20 billion $EBTC tokens are distributed at Token Generation Event (TGE) as follows:

```
┌─────────────────────────────────────────────────────────────┐
│                 $EBTC TOKEN DISTRIBUTION                     │
│                    (20 Billion Total)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ████████████████████████████████████████████ 65% (13B)    │
│   Protocol / Liquidity Vault                                 │
│                                                              │
│   ████████████████ 20% (4B)                                 │
│   Marketing                                                  │
│                                                              │
│   ████████ 10% (2B)                                         │
│   NFT Holder TGE Airdrop                                    │
│                                                              │
│   ████ 5% (1B)                                              │
│   Team (Vested)                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Allocation Breakdown

| Allocation | Percentage | Amount | Recipient | Purpose |
|------------|------------|--------|-----------|---------|
| Protocol | 65% | 13B | LiquidityVault | Mint rewards, claims, LP, buybacks |
| Marketing | 20% | 4B | Marketing Wallet | Partnerships, KOLs, growth |
| NFT Holders | 10% | 2B | EBTProgram | TGE airdrop for NFT holders |
| Team | 5% | 1B | TeamVesting | Core team compensation |

## ETH Distribution from NFT Sales

When users mint EBT Card NFTs, the ETH collected is distributed after the fundraising period ends:

```
┌─────────────────────────────────────────────────────────────┐
│                 ETH DISTRIBUTION FROM SALES                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ████████████████████████████████████████████ 65%          │
│   Liquidity Vault (LP Provisioning & Buybacks)              │
│                                                              │
│   ████████████████ 20%                                      │
│   Marketing Wallet                                           │
│                                                              │
│   ████████ 10%                                              │
│   Treasury                                                   │
│                                                              │
│   ████ 5%                                                   │
│   Team Wallet                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### ETH Allocation Details

| Allocation | Percentage | Purpose |
|------------|------------|---------|
| Liquidity | 65% | DEX liquidity provisioning, monthly buybacks |
| Marketing | 20% | Paid in stablecoins for marketing operations |
| Treasury | 10% | Protocol operations and reserves |
| Team | 5% | Core team operations |

## Fundraising Mechanics

### Key Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Mint Price (Min) | 0.02 ETH | Minimum contribution per mint |
| Mint Price (Max) | 2 ETH | Maximum contribution per mint |
| Soft Cap | 20 ETH | Minimum to proceed with project |
| Hard Cap | 2,000 ETH | Maximum total raise |
| Fundraising Period | 30 days | Time window for minting |
| Rate Limit | 3 blocks | Minimum blocks between mints |

### Soft Cap Protection

If the soft cap (20 ETH) is **NOT** reached:

- Fundraising is considered unsuccessful
- All minters can claim refunds
- No token distribution occurs
- NFTs remain but have no token benefits

If the soft cap **IS** reached:

- Fundraising proceeds
- ETH is distributed per allocation
- Token distributions begin
- Monthly claims are enabled

### Token Distribution on Mint

Users receive $EBTC tokens proportional to their ETH contribution:

```
Base Rate: 20,000 $EBTC per 0.02 ETH

Formula:
tokens = (ethAmount / 0.02 ETH) * 20,000 $EBTC

Examples:
- 0.02 ETH → 20,000 $EBTC
- 0.10 ETH → 100,000 $EBTC
- 1.00 ETH → 1,000,000 $EBTC
- 2.00 ETH → 2,000,000 $EBTC
```

## Token Utility

### $EBTC Token Uses

1. **Governance** (Future)
   - Vote on protocol parameters
   - Vote on treasury allocation

2. **Staking** (Planned)
   - Stake tokens for rewards
   - LP staking incentives

3. **Access** (Planned)
   - Premium features
   - Exclusive events

4. **Trading**
   - DEX trading pairs
   - Liquidity provision

### NFT Utility

1. **Token Bound Account**
   - Each NFT owns a wallet
   - Receives $EBTC tokens
   - Can hold other assets

2. **Monthly Claims**
   - Up to 3 monthly stipends
   - Based on activity score (0-1000)
   - Auto-deposits to TBA

3. **Reapplication**
   - After 3 claims, reapply for new season
   - Score-based eligibility
   - New base amount allocation

## Vesting Schedules

### Team Vesting (TeamVesting.sol)

| Parameter | Value |
|-----------|-------|
| Total Allocation | 1B $EBTC (5%) |
| TGE Unlock | 1% (200M) |
| Vesting Period | 4 months |
| Monthly Unlock | 1% (200M) per month |
| Cliff | None |

```
Timeline:
├── TGE: 200M (1%)
├── Month 1: +200M (1%)
├── Month 2: +200M (1%)
├── Month 3: +200M (1%)
└── Month 4: +200M (1%)
    Total: 1B (5%)
```

### Marketing Vesting (MarketingVesting.sol)

Marketing partners (KOLs, ambassadors) receive vested allocations:

| Parameter | Configurable |
|-----------|--------------|
| Vesting Duration | Yes (e.g., 90 days) |
| Linear Vesting | Yes |
| Revocable | Yes/No (per contract) |
| Beneficiary | Set at creation |

```
Example KOL Vesting (90 days, 1M tokens):
├── Day 0: 0 tokens claimable
├── Day 30: ~333K tokens claimable
├── Day 60: ~666K tokens claimable
└── Day 90: 1M tokens claimable
```

## Economic Model

### Incentive Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    ECONOMIC FLYWHEEL                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Users Mint NFTs ──────────┐                               │
│         │                   │                                │
│         ▼                   ▼                                │
│   Receive $EBTC      ETH to Protocol                        │
│         │                   │                                │
│         ▼                   ▼                                │
│   Trade/Hold $EBTC   65% to Liquidity                       │
│         │                   │                                │
│         ▼                   ▼                                │
│   Token Demand ◄──── Monthly Buybacks                       │
│         │                   │                                │
│         └───────────────────┘                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Monthly Operations

The LiquidityVault performs monthly operations:

1. **Buyback Execution**
   - Use portion of ETH for buybacks
   - Support token price

2. **LP Management**
   - Add liquidity to DEX pairs
   - Manage LP positions

3. **Distribution**
   - Process monthly claims
   - Distribute to TBAs

### Claim Mechanics

Monthly claims are based on user activity scores:

```
Base Amount: Set at approval (e.g., 20,000 $EBTC)
Score Range: 0 - 1000

Formula:
claimAmount = baseAmount + (baseAmount * score / 1000)

Examples (base = 20,000):
- Score 0:    20,000 + 0 = 20,000 $EBTC
- Score 500:  20,000 + 10,000 = 30,000 $EBTC
- Score 1000: 20,000 + 20,000 = 40,000 $EBTC
```

### Season Structure

```
Season Length: 3 months (3 claims)
Claims per Season: 3
Reapplication: Required after each season

Season 1 Example:
├── Month 1: Claim #1
├── Month 2: Claim #2
├── Month 3: Claim #3
└── Reapply for Season 2
```

## Contract Addresses

### Sepolia Testnet (Chain ID: 11155111)

| Contract | Address |
|----------|---------|
| EBTProgram (SNAP) | `0x9A7809EB76D30A754b730Dcfff1286bBff0775aa` |
| FoodStamps ($EBTC) | `0xd89406651698c85423e94D932bac95fA5Ab729Ec` |
| ERC6551Registry | `0xb22F642c3303bDe27131f58b46E7d75Aa194df0c` |
| ERC6551Account | `0xb812Dd421F2AB112fc7c33c75369148D115bEB4E` |
| EBTApplication | `0x2E84f1fFF8E37A55Cc90B2f268C0d233d5aE5045` |
| LiquidityVault | `0x6d15041ce06E367776CdcE1aFf1A2fAD31f44131` |
| TeamVesting | `0xa1400a541c0fE2364fd502003C5273AEFaA0D244` |

### Deployment Info

| Property | Value |
|----------|-------|
| Deployment Date | 2025-11-26 |
| Block Number | 9714446 |
| Deployer | `0x1Dc2040919412AC58A999B981Bff5Ea19181ccb9` |

## Disclaimer

This document describes the intended tokenomics of The EBT Program. This is a satirical art project about wealth inequality and social safety nets. Cryptocurrency tokens have no guaranteed value. Token distribution mechanics may be adjusted based on market conditions and protocol governance.

---

For technical implementation details, see [Smart Contracts README](../smart-contracts/README.md).
