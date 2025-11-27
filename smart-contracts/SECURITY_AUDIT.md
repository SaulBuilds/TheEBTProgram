# EBT Program Smart Contract Security Audit

**Audit Date:** November 2024
**Auditor:** Internal Review
**Contracts Version:** Pre-Testnet v2

---

## Executive Summary

This audit examined 8 main smart contracts and 2 interfaces in the EBT Program ecosystem. The contracts implement an ERC721-based NFT system with ERC-6551 token-bound accounts, ERC20 token distribution, and vesting mechanisms.

**Overall Security Posture:** IMPROVED - All critical issues have been remediated.

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 6 | ✅ ALL FIXED |
| HIGH | 8 | Fix before testnet |
| MEDIUM | 9 | Fix before mainnet |
| LOW | 8 | Best practices |

---

## Contract Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User → EBTApplication.apply4EBT() → Admin approves            │
│                    ↓                                             │
│   User → EBTProgram.mint() → Creates NFT + TBA                  │
│                    ↓                                             │
│   LiquidityVault.distributeAtMint() → Sends $FOOD to TBA        │
│                    ↓                                             │
│   Protocol → EBTProgram.claim() → Monthly token claims          │
│                    ↓                                             │
│   User → EBTProgram.reapply() → After 3 claims, reapply         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN DISTRIBUTION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   FoodStamps (20B $FOOD)                                        │
│   ├── 65% (13B) → LiquidityVault (mints, claims, LP)           │
│   ├── 20% (4B)  → Marketing Wallet (TGE)                        │
│   ├── 10% (2B)  → EBTProgram (TGE Airdrop for NFT holders)     │
│   └── 5%  (1B)  → TeamVesting (1% TGE + 1%/month × 4)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ETH DISTRIBUTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   NFT Sale Revenue                                               │
│   ├── 65% → LiquidityVault (LP + Buybacks)                      │
│   ├── 20% → Marketing Wallet                                     │
│   ├── 10% → Treasury                                             │
│   └── 5%  → Team Wallet                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CRITICAL ISSUES

### C-1: Automatic Approval Vulnerability in EBTApplication
**File:** `EBTApplication.sol:86-88`
**Status:** ✅ FIXED

**Description:**
The `apply4EBT()` function automatically approves users if their userID hashes to values 0 or 1 in the `headOfHouseHold` mapping. An attacker could craft userIDs to exploit this.

**Fix Applied:**
- Removed `headOfHouseHold` mapping and automatic approval logic
- All users must now be explicitly approved by admin
- Added comment explaining the security rationale

---

### C-2: TBA Asset Locking for Marketplace Protection
**File:** `ERC6551Account.sol`, `EBTProgram.sol`
**Status:** ✅ FIXED

**Description:**
TBAs needed protection against sellers draining assets between marketplace listing and sale completion. A buyer could purchase an NFT expecting assets in the TBA, only to find the seller drained them in the same block.

**Fix Applied:**
Implemented integrated TBA locking controlled by the NFT contract:

1. **ERC6551Account.sol** - Simple global lock with NFT contract authority:
   - `_assetsLocked` boolean locks ALL outgoing transfers
   - `lockAssets()` / `unlockAssets()` callable only by NFT contract (`onlyNFTContract`)
   - All transfer functions use `whenNotLocked` modifier
   - `isLocked()` view function for status checks

2. **EBTProgram.sol** - Automatic lock/unlock on approvals:
   - `approve()` override: Auto-locks TBA when NFT approved for transfer
   - `setApprovalForAll()` override: Auto-locks TBA when operator approved
   - `requestUnlock()`: Owner can unlock only if ALL approvals are removed
   - `_beforeTokenTransfer()`: Auto-unlocks TBA when NFT is actually transferred
   - Events: `TBALocked(tokenId, tba, approvedAddress)`, `TBAUnlocked(tokenId, tba)`

**Security Properties:**
- Seller cannot drain TBA while NFT is listed (approval = locked)
- Buyer receives TBA with all assets intact after transfer
- Only the NFT contract can lock/unlock (prevents external manipulation)
- Unlock requires NO active approvals (getApproved == address(0))

**Test Coverage:** 31 tests in `TBALocking.t.sol`:
- 21 unit tests for lock/unlock behavior
- 2 fuzz tests for random addresses
- 8 penetration tests for attack vectors

---

### C-3: Missing Reentrancy Guard in EBTApplication
**File:** `EBTApplication.sol`
**Status:** ✅ FIXED

**Description:**
No ReentrancyGuard on state-modifying functions that are called from EBTProgram.

**Fix Applied:**
- Added `ReentrancyGuard` inheritance from OpenZeppelin
- Applied `nonReentrant` modifier to `apply4EBT()` function

---

### C-4: Score Validation Bypass
**File:** `EBTProgram.sol:232-268`
**Status:** ✅ FIXED

**Description:**
Protocol caller can set arbitrary scores without on-chain validation. If compromised, unlimited token minting possible.

**Fix Applied:**
- Changed `claim()` function signature from `claim(tokenId, score)` to `claim(tokenId)`
- Score is now fetched from `_ebtApplication.getUserScore(userID)` inside the function
- Added validation that score does not exceed 1000
- Protocol caller can no longer manipulate scores

---

### C-5: Missing Initialization Checks
**File:** `EBTProgram.sol`
**Status:** ✅ FIXED

**Description:**
Critical addresses (protocolCaller, liquidityVault) can be zero, causing operations to fail or behave unexpectedly.

**Fix Applied:**
- Added `initialized` state variable and `whenInitialized` modifier
- Created `initialize()` function that sets all critical addresses at once
- Added `AlreadyInitialized` and `NotInitialized` errors
- `mint()` and `claim()` now require initialization
- Added `isFullyConfigured()` view function to verify setup
- Emits `ContractInitialized` event with all addresses

---

### C-6: ERC6551Registry Bytecode Encoding Bug
**File:** `ERC6551Registry.sol:109-134`
**Status:** ✅ FIXED

**Description:**
The `_creationCode()` function was generating incorrect bytecode for TBA deployment. The init code (`hex"3d60ad80600a3d3981f3"`) is designed to return 0xAD (173) bytes of runtime code, but the function was only encoding 141 bytes. This caused `token()` to read garbage data from memory, returning incorrect chainId, tokenContract, and tokenId values.

**Root Cause:**
The ERC-6551 spec requires 173 bytes of runtime code:
- 10 bytes: proxy prefix
- 20 bytes: implementation address
- 15 bytes: proxy suffix
- 32 bytes: salt (WAS MISSING)
- 32 bytes: chainId
- 32 bytes: tokenContract (padded address)
- 32 bytes: tokenId

The original code omitted the 32-byte salt from `abi.encode()`, causing all context values to be offset and corrupted.

**Fix Applied:**
```solidity
// Before (BROKEN):
abi.encode(chainId_, tokenContract_, tokenId_)  // Only 96 bytes

// After (FIXED):
abi.encode(salt_, chainId_, tokenContract_, tokenId_)  // 128 bytes
```

Updated `_creationCode()` signature to accept `salt_` parameter:
```solidity
function _creationCode(
    address implementation_,
    bytes32 salt_,           // NEW: Required for ERC-6551 compliance
    uint256 chainId_,
    address tokenContract_,
    uint256 tokenId_
) internal pure returns (bytes memory)
```

**Impact of Bug:**
- `token()` returned garbage: chainId was actually the EBTProgram address
- TBA locking would fail because `onlyNFTContract` checked wrong address
- All TBA ownership verification would be broken

---

## HIGH SEVERITY ISSUES

### H-1: Merkle Proof Missing Chain ID and Deadline
**File:** `EBTProgram.sol:284-310`

### H-2: Integer Division Precision Loss
**File:** `EBTProgram.sol:499-504`

### H-3: Mint Function Missing Wallet Verification
**File:** `EBTProgram.sol:164-226`

### H-4: FoodStamps Proxy Allowance Logic Error
**File:** `FoodStamps.sol:111-125`

### H-5: Soft Cap Not Enforced in closeFundraising
**File:** `EBTProgram.sol:344-383`

### H-6: Block-Based Rate Limiting Vulnerable
**File:** `EBTProgram.sol:155-158`

### H-7: Monthly Operation Not Implemented
**File:** `LiquidityVault.sol:117-133`

### H-8: Reapplication Missing Re-verification
**File:** `EBTProgram.sol:317-328`

---

## MEDIUM SEVERITY ISSUES

### M-1 through M-9
See full audit report for details on:
- Metadata validation
- Team vesting termination
- Marketing vesting race conditions
- Registry implementation switching
- TBA bytecode extraction fragility

---

## USER STORIES & FLOWS

### User: NFT Applicant

**Story 1: Apply for EBT Card**
```
As a user, I want to apply for an EBT card NFT
So that I can receive $FOOD token benefits

GIVEN I have a wallet with ETH for gas
WHEN I call EBTApplication.apply4EBT(username, profilePic, twitter, score, userID)
THEN my application is recorded on-chain
AND I receive an ApplicationSubmitted event
```

**Story 2: Mint EBT Card NFT**
```
As an approved applicant, I want to mint my EBT card NFT
So that I have a token-bound account to receive benefits

GIVEN my application has been approved by admin
AND fundraising is active
AND I have 0.02-2 ETH to spend
WHEN I call EBTProgram.mint(userID) with ETH
THEN I receive an EBT Card NFT
AND a Token Bound Account is created for my NFT
AND I receive $FOOD tokens proportional to my payment
```

**Story 3: Claim Monthly Benefits**
```
As an NFT holder, I want to claim my monthly $FOOD tokens
So that I receive ongoing benefits

GIVEN I own an EBT Card NFT
AND 30 days have passed since my last claim
AND I have fewer than 3 total claims
WHEN the protocol calls claim(tokenId, score) on my behalf
THEN my TBA receives baseAmount + (baseAmount × score/1000) tokens
AND my claim count increases
```

**Story 4: Reapply After Benefits Expire**
```
As an NFT holder who completed 3 claims, I want to reapply
So that I can continue receiving benefits

GIVEN I own an EBT Card NFT
AND I have completed 3 claims
WHEN I call EBTProgram.reapply(tokenId)
THEN my reapplication status is set to PENDING
AND admin can approve with a new base amount
```

**Story 4a: List NFT on Marketplace (Auto-Lock)**
```
As an NFT holder, I want to list my EBT Card on a marketplace
So that I can sell it with all TBA assets included

GIVEN I own an EBT Card NFT with assets in its TBA
WHEN I approve a marketplace to transfer my NFT
THEN my TBA is automatically locked
AND I cannot withdraw any assets from the TBA
AND potential buyers can trust the TBA contents won't change
```

**Story 4b: Cancel Marketplace Listing (Request Unlock)**
```
As an NFT holder, I want to cancel my marketplace listing
So that I can access my TBA assets again

GIVEN I have an EBT Card NFT listed (approved) on a marketplace
AND my TBA is locked
WHEN I revoke the marketplace approval (approve(address(0)))
AND I call requestUnlock(tokenId)
THEN my TBA is unlocked
AND I can access all assets again
```

**Story 4c: Buy NFT from Marketplace (Auto-Unlock on Transfer)**
```
As a buyer, I want to purchase an EBT Card NFT
So that I receive the NFT and all its TBA assets

GIVEN seller has listed an EBT Card with locked TBA
WHEN I complete the purchase through the marketplace
THEN the NFT transfers to me
AND the TBA automatically unlocks
AND I become the new TBA owner with full asset access
```

---

### Admin: Protocol Operator

**Story 5: Approve Applications**
```
As an admin, I want to approve user applications
So that approved users can mint NFTs

GIVEN I have ADMIN_ROLE in EBTApplication
WHEN I call approveUsers([userID1, userID2, ...])
THEN those users become approved
AND they can now call mint()
```

**Story 6: Manage Fundraising**
```
As the owner, I want to manage the fundraising period
So that I can control when minting is allowed

GIVEN I am the contract owner
WHEN I call setFundraisingPeriod(7 days)
THEN fundraising runs for 7 days from deployment
WHEN I call closeFundraising() after the period
THEN minting is disabled
AND ETH can be distributed
```

**Story 7: Create Marketing Partnerships**
```
As the owner, I want to create vesting contracts for KOLs
So that marketing partners receive tokens over time

GIVEN I have tokens in LiquidityVault
WHEN I call createMarketingVesting(beneficiary, amount, 90 days, true, "KOL_Name", "KOL")
THEN a new MarketingVesting contract is deployed
AND tokens are transferred to the vesting contract
AND the KOL can claim as tokens vest linearly
```

---

### Developer: Protocol Caller

**Story 8: Execute Claims**
```
As the protocol backend, I want to execute claims for users
So that users receive their monthly benefits

GIVEN I am the designated protocolCaller address
AND I have calculated the user's score (0-1000)
WHEN I call claim(tokenId, score)
THEN the user's TBA receives tokens
AND the claim is recorded
```

**Story 9: Execute TGE Airdrop**
```
As the protocol backend, I want to distribute TGE airdrops
So that NFT holders receive their initial token allocation

GIVEN merkle root is set by owner
AND user has valid merkle proof
WHEN user calls claimTGEAirdrop(tokenId, amount, merkleProof)
THEN their TBA receives the airdrop amount
AND they cannot claim again
```

---

## FUNCTION ACCESS CONTROL MATRIX

| Contract | Function | Access | Notes |
|----------|----------|--------|-------|
| **EBTApplication** |
| | apply4EBT | Public | Anyone can apply |
| | approveUsers | ADMIN_ROLE | Batch approve |
| | setMetadataURI | ADMIN_ROLE | Set IPFS URI |
| | setUserScore | ADMIN_ROLE | Update scores |
| | incrementInstallmentCount | ADMIN_ROLE | Called by EBTProgram |
| **EBTProgram** |
| | mint | Public + Payable | During fundraising only |
| | claim | onlyProtocol | Protocol caller only |
| | claimTGEAirdrop | Public | With merkle proof |
| | reapply | Public | NFT owner only (checked internally) |
| | approveReapplication | onlyOwner | Admin approval |
| | closeFundraising | onlyOwner | End fundraising |
| | distributeETH | onlyOwner | Distribute raised ETH |
| | setProtocolCaller | onlyOwner | Critical config |
| | setLiquidityVault | onlyOwner | Critical config |
| | setBlacklistStatus | onlyOwner | Security control |
| | approve | Public | Auto-locks TBA on approval |
| | setApprovalForAll | Public | Auto-locks TBA on operator approval |
| | requestUnlock | Public | NFT owner only, requires no approvals |
| **ERC6551Account** |
| | lockAssets | onlyNFTContract | Called by EBTProgram on approval |
| | unlockAssets | onlyNFTContract | Called by EBTProgram on transfer/request |
| | executeCall | onlyTokenOwner + whenNotLocked | Blocked while locked |
| | transferERC20/721/1155 | onlyTokenOwner + whenNotLocked | Blocked while locked |
| **LiquidityVault** |
| | distributeAtMint | onlyEBTProgram | Called during mint |
| | distributeAtClaim | onlyEBTProgram | Called during claim |
| | createMarketingVesting | onlyOwner | Create vesting |
| | revokeMarketingVesting | onlyOwner | Revoke vesting |
| | monthlyOperation | onlyOwner | Monthly buyback |
| **FoodStamps** |
| | initialDistribution | onlyOwner | One-time TGE |
| | mint | vault or owner | Post-distribution mints |
| | pause/unpause | onlyOwner | Emergency controls |
| **TeamVesting** |
| | startTGE | onlyOwner | Begin vesting |
| | claimMonthly | teamWallet | Claim vested tokens |

---

## RECOMMENDED TESTING STRATEGY

### Unit Tests (Current: 82 tests)
- [x] EBTApplication approval flow
- [x] EBTProgram minting
- [x] EBTProgram claiming
- [x] EBTProgram reapplication
- [x] FoodStamps distribution
- [x] MarketingVesting linear vesting
- [x] TeamVesting schedule
- [x] TBA locking on approval (21 unit tests)
- [x] TBA locking fuzz tests (2 tests)
- [x] TBA locking penetration tests (8 tests)

### Fuzz Tests (Partial)
- [ ] Fuzz mint with random ETH amounts (0.02-2 ETH range)
- [ ] Fuzz claim with random scores (0-1000)
- [ ] Fuzz vesting with random time warps
- [ ] Fuzz merkle proofs with random data
- [x] Fuzz TBA locking with random addresses

### Integration Tests (To Add)
- [ ] Full user journey: apply → approve → mint → claim × 3 → reapply
- [ ] Fundraising lifecycle: start → mint → close → distribute
- [ ] TGE flow: distribute → airdrop claims
- [ ] Marketing partnership: create → vest → claim → revoke

### Security Tests (Partial)
- [x] TBA locking reentrancy simulations
- [x] TBA locking access control bypass attempts
- [x] TBA front-running attack simulations
- [ ] Integer overflow/underflow edge cases
- [ ] DoS attack vectors

---

## REMEDIATION PLAN

### Phase 1: Critical Fixes (Before Any Deployment) ✅ COMPLETE
1. ✅ Fix EBTApplication automatic approval - Removed headOfHouseHold auto-approval
2. ✅ Fix TBA asset locking - Integrated lock via EBTProgram approval overrides
3. ✅ Add ReentrancyGuard to EBTApplication - Added nonReentrant modifier
4. ✅ Add score validation in claim() - Score now fetched from EBTApplication
5. ✅ Add initialization checks - Added initialize() state machine
6. ✅ Fix ERC6551Registry bytecode encoding - Added missing salt to abi.encode()

### Phase 2: High Severity (Before Testnet)
7. Fix merkle proof security
8. Fix mint wallet verification
9. Fix proxy allowance logic
10. Implement soft cap enforcement
11. Replace block-based with time-based rate limiting

### Phase 3: Medium Severity (Before Mainnet)
12. Implement proper monthly operations
13. Add metadata validation
14. Add vesting emergency controls
15. Improve event emission

### Phase 4: Hardening
16. Add comprehensive fuzz tests
17. Add integration test suite
18. External audit
19. Bug bounty program

---

## DEPLOYMENT CHECKLIST

- [ ] All critical issues resolved
- [ ] All high severity issues resolved
- [ ] 80%+ test coverage
- [ ] Fuzz tests passing
- [ ] Integration tests passing
- [ ] External audit completed
- [ ] Multisig wallet configured
- [ ] Deployment script tested on fork
- [ ] Emergency procedures documented
- [ ] Admin keys secured

---

## EMERGENCY PROCEDURES

### Pause Protocol
1. Call `FoodStamps.pause()` to stop token transfers
2. Call `EBTProgram.pause()` (if implemented) to stop minting

### Blacklist Malicious Actor
1. Call `EBTProgram.setBlacklistStatus([address], true)`

### Revoke Marketing Vesting
1. Call `LiquidityVault.revokeMarketingVesting(vestingAddress)`

### Emergency Token Withdrawal
1. Call `LiquidityVault.emergencyWithdrawTokens(to, amount)`
2. Call `LiquidityVault.emergencyWithdrawETH(to, amount)`

---

*This document should be updated as issues are resolved and new findings emerge.*
