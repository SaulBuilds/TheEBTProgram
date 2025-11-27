# Sprint 002: Security Fixes & Integration Testing

**Sprint Goal**: Fix all auditor findings and achieve comprehensive integration test coverage across frontend-contract integrations

**Start Date**: 2025-11-27
**Status**: In Progress (Phase 1 COMPLETE)
**Priority**: CRITICAL (Pre-Mainnet)

---

## Executive Summary

This sprint addresses all findings from the external security audit and implements comprehensive integration testing to validate frontend-contract assumptions. The sprint is divided into 5 phases:

| Phase | Focus Area | Priority | Effort |
|-------|------------|----------|--------|
| 1 | ABI Alignment & Hook Fixes | CRITICAL | High |
| 2 | Dynamic Pricing UI | HIGH | Medium |
| 3 | API Security Fixes | HIGH | Medium |
| 4 | Integration Test Suite | HIGH | High |
| 5 | Operational Security | MEDIUM | Low |

---

## Phase 1: ABI Alignment & Hook Fixes (CRITICAL)

### Audit Finding
**H-ABI**: Frontend wagmi hooks call non-existent contract functions, causing all transactions to revert.

### Current Broken Functions (useEBTProgram.ts)

| Hook | Calls | Actual Contract Function |
|------|-------|-------------------------|
| `useTotalFundsRaised()` | `totalFundsRaised` | `totalRaised` |
| `useTokenAccount()` | `getTokenAccount` | `getTBA` |
| `useInstallmentCount()` | `installmentCount` | `tokenData[tokenId].claimCount` |
| `useMintedTimestamp()` | `tokenIdToMintedTimestamp` | N/A (remove) |
| `useClaimInstallment()` | `claimInstallment` | `claim` (protocol-only!) |
| `useWithdraw()` | `withdraw` | N/A (remove) |

### Current Broken Functions (useAdminContract.ts)

| Hook | Calls | Actual Contract Function |
|------|-------|-------------------------|
| `useWithdrawalPeriod()` | `WITHDRAWAL_PERIOD` | N/A (remove) |
| `useFundraisingDeadline()` | `fundraisingDeadline` | Calculate from state |
| `useCloseFundraising()` | `closeFundraisingPeriod` | `closeFundraising` |
| `useSetWithdrawalPeriod()` | `setWithdrawalPeriod` | N/A (remove) |
| `useSetPayoutAddresses()` | `setPayoutAddresses` | `setDistributionWallets` |

### Current Broken Functions (useTBA.ts)

| Issue | Problem | Fix |
|-------|---------|-----|
| `DEFAULT_SEED` | Uses static zero seed | Use per-token salt from contract |
| `useTBAAddress()` | Computes wrong address | Use `EBTProgram.getTBA(tokenId)` directly |

### Tasks

#### 1.1 Fix useEBTProgram.ts
- [ ] 1.1.1 Rename `useTotalFundsRaised()` to `useTotalRaised()` with `functionName: 'totalRaised'`
- [ ] 1.1.2 Remove `useTokenAccount()` (use `getTBA` from useTBA instead)
- [ ] 1.1.3 Create `useTokenData(tokenId)` to read `tokenData` mapping
- [ ] 1.1.4 Create `useClaimCount(tokenId)` from `tokenData[tokenId].claimCount`
- [ ] 1.1.5 Remove `useMintedTimestamp()` (field doesn't exist)
- [ ] 1.1.6 Remove `useClaimInstallment()` (claim is protocol-only, not user-callable)
- [ ] 1.1.7 Remove `useWithdraw()` (function doesn't exist)
- [ ] 1.1.8 Add `useFundraisingStartTime()` to read `fundraisingStartTime`
- [ ] 1.1.9 Add `useFundraisingPeriod()` to read `_fundraisingPeriod` (via getter if exists)
- [ ] 1.1.10 Add `useTokenIdToUserID(tokenId)` to read user mapping
- [ ] 1.1.11 Add `useContributions(address)` to read contribution amounts
- [ ] 1.1.12 Update `useMint()` to accept dynamic price (see Phase 2)

#### 1.2 Fix useAdminContract.ts
- [ ] 1.2.1 Remove `useWithdrawalPeriod()` (constant doesn't exist)
- [ ] 1.2.2 Remove `useFundraisingDeadline()` or calculate from `fundraisingStartTime + period`
- [ ] 1.2.3 Fix `useCloseFundraising()` to use `functionName: 'closeFundraising'`
- [ ] 1.2.4 Remove `useSetWithdrawalPeriod()` (function doesn't exist)
- [ ] 1.2.5 Rename `useSetPayoutAddresses()` to `useSetDistributionWallets()` with correct args
- [ ] 1.2.6 Add `useDistributeETH()` for post-fundraising distribution
- [ ] 1.2.7 Add `useSetProtocolCaller()` for admin configuration
- [ ] 1.2.8 Add `usePauseProgram()` and `useUnpauseProgram()` for emergency controls
- [ ] 1.2.9 Add `useApproveReapplication()` for reapplication flow
- [ ] 1.2.10 Add `useSetTGEMerkleRoot()` for airdrop setup

#### 1.3 Fix useTBA.ts
- [ ] 1.3.1 Remove `DEFAULT_SEED` constant (not used in contract correctly)
- [ ] 1.3.2 Update `useTBAAddress()` to call `EBTProgram.getTBA(tokenId)` instead of registry
- [ ] 1.3.3 Keep `useTokenAccountAddress()` as alias for consistency
- [ ] 1.3.4 Add `useTBANonce(tbaAddress)` to read transaction nonce
- [ ] 1.3.5 Verify all TBA hooks work with locked state

### Files to Modify
```
frontend/src/lib/hooks/useEBTProgram.ts    # Major refactor
frontend/src/lib/hooks/useAdminContract.ts # Major refactor
frontend/src/lib/hooks/useTBA.ts           # TBA address fix
frontend/src/lib/contracts/addresses.ts    # Add constants
```

### Acceptance Criteria
- [ ] All hooks call existing contract functions only
- [ ] TypeScript compiles without errors
- [ ] Runtime tests show successful contract reads
- [ ] No user-facing claims UI (protocol-only)

---

## Phase 2: Dynamic Pricing UI (HIGH)

### Audit Finding
**H-PRICE**: `useMint` hardcodes 0.02 ETH, ignoring the 0.02-2 ETH dynamic pricing range.

### Current Implementation
```typescript
// addresses.ts
export const MINT_PRICE = BigInt('20000000000000000'); // 0.02 ETH - HARDCODED

// useEBTProgram.ts useMint()
value: MINT_PRICE,  // Always 0.02 ETH
```

### Target Implementation
```typescript
// User selects price in UI between MIN_PRICE and MAX_PRICE
// Price must be multiple of PRICE_PRECISION (0.001 ETH)

const mint = (userId: string, mintPrice: bigint) => {
  // Validate on client side
  if (mintPrice < MIN_PRICE) throw new Error('Price below minimum');
  if (mintPrice > MAX_PRICE) throw new Error('Price above maximum');
  if (mintPrice % PRICE_PRECISION !== 0n) throw new Error('Invalid precision');

  writeContract({
    ...ebtProgramConfig,
    functionName: 'mint',
    args: [userId],
    value: mintPrice,  // Dynamic!
  });
};
```

### Tasks

#### 2.1 Update Contract Constants
- [ ] 2.1.1 Add `PRICE_PRECISION = BigInt('1000000000000000')` (0.001 ETH) to addresses.ts
- [ ] 2.1.2 Rename `MINT_PRICE` to `MIN_MINT_PRICE` for clarity
- [ ] 2.1.3 Ensure `MAX_MINT_PRICE` is already defined (2 ETH)

#### 2.2 Update useMint Hook
- [ ] 2.2.1 Add `mintPrice: bigint` parameter to mint function
- [ ] 2.2.2 Add client-side validation for price bounds
- [ ] 2.2.3 Add client-side validation for price precision
- [ ] 2.2.4 Use dynamic price as `value` in writeContract
- [ ] 2.2.5 Add `calculateTokensReceived(price)` helper function

#### 2.3 Update Mint UI
- [ ] 2.3.1 Create `PriceSelector.tsx` component with slider/input
- [ ] 2.3.2 Show min/max bounds visually
- [ ] 2.3.3 Show tokens to receive based on selected price
- [ ] 2.3.4 Validate price precision (step 0.001 ETH)
- [ ] 2.3.5 Update `MintContent.tsx` to use PriceSelector
- [ ] 2.3.6 Update `StepMint.tsx` in wizard flow

#### 2.4 Calculate Token Preview
- [ ] 2.4.1 Implement formula: `tokens = (price / MIN_PRICE) * BASE_TOKENS`
- [ ] 2.4.2 Display "You will receive X $EBTC" preview
- [ ] 2.4.3 Show comparison to minimum contribution

### Files to Create
```
frontend/src/components/mint/PriceSelector.tsx
```

### Files to Modify
```
frontend/src/lib/contracts/addresses.ts
frontend/src/lib/hooks/useEBTProgram.ts
frontend/src/app/mint/[userId]/MintContent.tsx
frontend/src/app/apply/components/StepMint.tsx
```

### Acceptance Criteria
- [ ] Users can select any valid price between 0.02-2 ETH
- [ ] Price must be multiple of 0.001 ETH
- [ ] Token preview updates as price changes
- [ ] Transactions succeed with various price values

---

## Phase 3: API Security Fixes (HIGH)

### Audit Finding
**M-PII**: Leaderboard returns email and social handles without auth
**M-BYPASS**: PRIVY_BYPASS allows unconditional auth bypass in non-prod
**M-ADMIN**: Admin routes use only static token

### Tasks

#### 3.1 Fix PII Exposure in Leaderboard
- [ ] 3.1.1 Remove email from leaderboard select
- [ ] 3.1.2 Remove twitter/discord/github from leaderboard response
- [ ] 3.1.3 Only return: userId, username, profilePicURL, score, mintedTokenId
- [ ] 3.1.4 Add test to verify no PII in response

#### 3.2 Fix Auth Bypass Vulnerability
- [ ] 3.2.1 Add localhost check to bypass condition
- [ ] 3.2.2 Add explicit domain allowlist for bypass
- [ ] 3.2.3 Log when bypass is used for audit trail
- [ ] 3.2.4 Add comment warning about production danger

#### 3.3 Strengthen Admin Auth
- [ ] 3.3.1 Add rate limiting to admin endpoints (10 req/min)
- [ ] 3.3.2 Add audit logging for admin actions
- [ ] 3.3.3 Document token rotation procedure
- [ ] 3.3.4 Add IP allowlist option (env var)

#### 3.4 Fix Metadata Endpoint
- [ ] 3.4.1 Validate JSON structure before returning
- [ ] 3.4.2 Return structured error for malformed data
- [ ] 3.4.3 Sanitize any user-provided fields

### Files to Modify
```
frontend/src/app/api/leaderboard/route.ts
frontend/src/lib/auth.ts
frontend/src/app/api/admin/**/route.ts (all admin routes)
frontend/src/app/api/metadata/[tokenId]/route.ts
```

### Acceptance Criteria
- [ ] Leaderboard returns no PII (email, social handles)
- [ ] Auth bypass only works on localhost
- [ ] Admin endpoints have rate limiting
- [ ] Metadata endpoint validates JSON

---

## Phase 4: Integration Test Suite (HIGH)

### Objective
Create comprehensive integration tests that validate ALL frontend-contract assumptions.

### Test Categories

#### 4.1 Hook Unit Tests
Test each wagmi hook independently with mock contract responses.

```typescript
// __tests__/hooks/useEBTProgram.test.ts
describe('useEBTProgram hooks', () => {
  it('useTotalRaised returns correct value', async () => {});
  it('useHasMinted returns true for minted address', async () => {});
  it('useSoftCap returns configured value', async () => {});
  it('useHardCap returns configured value', async () => {});
  it('useMint succeeds with valid price', async () => {});
  it('useMint fails below MIN_PRICE', async () => {});
  it('useMint fails above MAX_PRICE', async () => {});
});
```

#### 4.2 TBA Integration Tests
Test TBA address computation and operations.

```typescript
// __tests__/hooks/useTBA.test.ts
describe('useTBA hooks', () => {
  it('useTokenAccountAddress matches on-chain getTBA', async () => {});
  it('useTBABalance returns correct EBTC balance', async () => {});
  it('useTBALocked returns lock status', async () => {});
  it('useTBATransferERC20 fails when locked', async () => {});
  it('useTBATransferERC20 succeeds when unlocked', async () => {});
});
```

#### 4.3 Contract State Tests
Test contract reads match expected deployment state.

```typescript
// __tests__/integration/contract-state.test.ts
describe('Contract State Verification', () => {
  it('EBTProgram is initialized', async () => {});
  it('softCap matches expected value', async () => {});
  it('hardCap matches expected value', async () => {});
  it('FoodStamps total supply is 20B', async () => {});
  it('LiquidityVault has 13B tokens', async () => {});
  it('TeamVesting has 1B tokens', async () => {});
  it('ERC6551Registry implementation is locked', async () => {});
});
```

#### 4.4 User Flow E2E Tests
Test complete user journeys.

```typescript
// __tests__/e2e/user-flows.test.ts
describe('User Flows', () => {
  describe('Application Flow', () => {
    it('submits application successfully', async () => {});
    it('rejects duplicate application', async () => {});
    it('approves application (admin)', async () => {});
  });

  describe('Mint Flow', () => {
    it('mints with minimum price', async () => {});
    it('mints with maximum price', async () => {});
    it('mints with custom price', async () => {});
    it('rejects mint for unapproved user', async () => {});
    it('rejects double mint from same wallet', async () => {});
    it('creates TBA on mint', async () => {});
    it('distributes initial tokens to TBA', async () => {});
  });

  describe('TBA Operations', () => {
    it('locks TBA on NFT approval', async () => {});
    it('blocks transfers when locked', async () => {});
    it('unlocks TBA when approval removed', async () => {});
    it('transfers ERC20 when unlocked', async () => {});
  });

  describe('Claim Flow (Protocol)', () => {
    // Note: These test protocol behavior, not user actions
    it('claim succeeds after 30 days', async () => {});
    it('claim fails before 30 days', async () => {});
    it('claim fails for non-protocol caller', async () => {});
    it('reapplication available after 3 claims', async () => {});
  });
});
```

#### 4.5 API Integration Tests
Test API endpoints work correctly.

```typescript
// __tests__/api/routes.test.ts
describe('API Routes', () => {
  describe('/api/leaderboard', () => {
    it('returns leaderboard without PII', async () => {});
    it('respects limit parameter', async () => {});
    it('filters by category', async () => {});
  });

  describe('/api/applications', () => {
    it('creates application with valid data', async () => {});
    it('rejects empty userId', async () => {});
    it('requires auth for submission', async () => {});
  });

  describe('/api/admin/*', () => {
    it('rejects without admin token', async () => {});
    it('approves user with valid token', async () => {});
    it('rate limits excessive requests', async () => {});
  });

  describe('/api/metadata/[tokenId]', () => {
    it('returns valid JSON for minted token', async () => {});
    it('returns 404 for unminted token', async () => {});
  });
});
```

### Test Infrastructure Tasks

#### 4.6 Setup Test Environment
- [ ] 4.6.1 Install test dependencies (vitest, @testing-library/react, msw)
- [ ] 4.6.2 Configure vitest for Next.js
- [ ] 4.6.3 Create test utilities for wagmi mocking
- [ ] 4.6.4 Create mock contract responses
- [ ] 4.6.5 Setup MSW handlers for API mocking

#### 4.7 Create Test Helpers
- [ ] 4.7.1 Create `test-utils.tsx` with renderWithProviders
- [ ] 4.7.2 Create `mock-contracts.ts` with mock ABI responses
- [ ] 4.7.3 Create `test-addresses.ts` with test contract addresses
- [ ] 4.7.4 Create `mock-privy.ts` for auth mocking

#### 4.8 Write Hook Tests
- [ ] 4.8.1 Write useEBTProgram tests (10+ tests)
- [ ] 4.8.2 Write useTBA tests (8+ tests)
- [ ] 4.8.3 Write useAdminContract tests (6+ tests)
- [ ] 4.8.4 Write useEBTApplication tests (4+ tests)
- [ ] 4.8.5 Write useFoodStamps tests (4+ tests)

#### 4.9 Write Integration Tests
- [ ] 4.9.1 Write contract state verification tests (8+ tests)
- [ ] 4.9.2 Write user flow E2E tests (15+ tests)
- [ ] 4.9.3 Write API route tests (12+ tests)

#### 4.10 Setup CI Pipeline
- [ ] 4.10.1 Add test script to package.json
- [ ] 4.10.2 Create GitHub Actions workflow for tests
- [ ] 4.10.3 Add test coverage reporting
- [ ] 4.10.4 Require passing tests for PR merge

### Files to Create
```
frontend/__tests__/
├── setup.ts                           # Test setup
├── test-utils.tsx                     # Render helpers
├── mocks/
│   ├── contracts.ts                   # Contract mocks
│   ├── handlers.ts                    # MSW handlers
│   └── privy.ts                       # Auth mocks
├── hooks/
│   ├── useEBTProgram.test.ts
│   ├── useTBA.test.ts
│   ├── useAdminContract.test.ts
│   ├── useEBTApplication.test.ts
│   └── useFoodStamps.test.ts
├── integration/
│   └── contract-state.test.ts
├── e2e/
│   └── user-flows.test.ts
└── api/
    └── routes.test.ts

frontend/vitest.config.ts              # Vitest configuration
```

### Acceptance Criteria
- [ ] 50+ integration tests written
- [ ] All tests pass
- [ ] Coverage > 80% for hooks
- [ ] CI runs tests on every PR
- [ ] No hook calls non-existent functions

---

## Phase 5: Operational Security (MEDIUM)

### Tasks

#### 5.1 Smart Contract Fixes (Low Priority from Audit)
- [ ] 5.1.1 Add `require(swapRouter != address(0))` to LiquidityVault.addLiquidity
- [ ] 5.1.2 Optionally add `whenNotPaused` to FoodStamps.mint (discuss with team)

#### 5.2 Documentation Updates
- [ ] 5.2.1 Update SECURITY_AUDIT.md with external audit findings
- [ ] 5.2.2 Document admin token rotation procedure
- [ ] 5.2.3 Document multisig setup requirements
- [ ] 5.2.4 Create operational runbook

#### 5.3 Deployment Preparation
- [ ] 5.3.1 Verify all environment variables documented
- [ ] 5.3.2 Create deployment checklist
- [ ] 5.3.3 Setup monitoring for admin endpoints
- [ ] 5.3.4 Configure alerts for suspicious activity

### Files to Modify
```
smart-contracts/contracts/LiquidityVault.sol  # Zero-address check
SECURITY_AUDIT.md                             # Update with external findings
.env.example                                  # Document all env vars
```

---

## Sprint Timeline

| Day | Focus | Deliverables |
|-----|-------|--------------|
| 1 | Phase 1.1-1.3 | Hook fixes complete |
| 2 | Phase 2 | Dynamic pricing UI |
| 3 | Phase 3 | API security fixes |
| 4-5 | Phase 4.6-4.7 | Test infrastructure |
| 6-7 | Phase 4.8-4.9 | Write tests |
| 8 | Phase 4.10 + 5 | CI + operational |

---

## Definition of Done

### Per-Task
- [ ] Code written and compiles
- [ ] TypeScript types correct
- [ ] Tests written (where applicable)
- [ ] Code reviewed
- [ ] Merged to main

### Per-Phase
- [ ] All tasks complete
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] Documentation updated

### Sprint Complete
- [ ] All 5 phases complete
- [ ] 50+ integration tests passing
- [ ] No auditor findings remaining
- [ ] CI pipeline running
- [ ] Ready for mainnet deployment

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ABI changes break existing users | HIGH | Deploy to testnet first, verify all flows |
| Dynamic pricing confuses users | MEDIUM | Clear UI with token preview |
| Test infrastructure delays | MEDIUM | Start with critical hooks, expand coverage |
| Missed edge cases | HIGH | Fuzz testing in smart contracts (already done) |

---

## Dependencies

### External
- External audit complete (YES)
- Multisig deployed (IN PROGRESS)
- Contract deployed to testnet (YES - Sepolia)

### Internal
- Sprint 001 complete (YES)
- ABIs up to date (YES)
- Contract addresses correct (YES)

---

## Progress Log

### 2025-11-27
- Created sprint documentation
- Analyzed all audit findings
- Mapped all broken hooks to fixes needed
- Defined comprehensive test plan

---

## Appendix A: Complete Function Mapping

### EBTProgram.sol - Available Functions

**View Functions:**
- `currentTokenId()` → uint256
- `totalRaised()` → uint256
- `softCap()` → uint256
- `hardCap()` → uint256
- `fundraisingClosed()` → bool
- `fundraisingStartTime()` → uint256
- `ethDistributed()` → bool
- `initialized()` → bool
- `hasMinted(address)` → bool
- `contributions(address)` → uint256
- `tokenData(uint256)` → TokenData struct
- `tokenIdToUserID(uint256)` → string
- `tokenMinter(uint256)` → address
- `getTBA(uint256)` → address
- `isBlacklisted(address)` → bool
- `tgeMerkleRoot()` → bytes32
- `tgeAirdropDeadline()` → uint256
- `isTBALocked(uint256)` → bool
- `tgeAllocationRemaining()` → uint256
- `protocolCaller()` → address
- `treasuryWallet()` → address
- `marketingWallet()` → address
- `teamWallet()` → address

**Write Functions (Public):**
- `mint(string userID)` payable
- `claimTGEAirdrop(uint256 tokenId, uint256 amount, bytes32[] proof)`
- `reapply(uint256 tokenId)`
- `approve(address to, uint256 tokenId)`
- `requestUnlock(uint256 tokenId)`
- `claimRefund()`

**Write Functions (Owner):**
- `initialize(...)`
- `closeFundraising()`
- `distributeETH()`
- `setProtocolCaller(address)`
- `setLiquidityVault(address)`
- `setDistributionWallets(address, address, address)`
- `setCaps(uint256, uint256)`
- `setTGEMerkleRoot(bytes32)`
- `setTGEAirdropDeadline(uint256)`
- `setBaseTokenURI(string)`
- `setBlacklistStatus(address[], bool)`
- `pause()`
- `unpause()`
- `approveReapplication(uint256, uint256)`
- `rejectReapplication(uint256)`
- `emergencyWithdrawETH(address, uint256)`
- `emergencyWithdrawTokens(address, address, uint256)`

**Write Functions (Protocol Only):**
- `claim(uint256 tokenId)` - NOT user-callable

### ERC6551Account.sol - Available Functions

**View Functions:**
- `owner()` → address
- `isLocked()` → bool
- `nonce()` → uint256
- `token()` → (chainId, tokenContract, tokenId)

**Write Functions (Token Owner + Not Locked):**
- `executeCall(address, uint256, bytes)`
- `transferERC20(address token, address to, uint256 amount)`
- `transferERC721(address nft, address to, uint256 tokenId)`
- `transferERC1155(address token, address to, uint256 id, uint256 amount, bytes data)`
- `approveERC20(address token, address spender, uint256 amount)`
- `approveERC721(address nft, address to, uint256 tokenId)`

**Write Functions (NFT Contract Only):**
- `lockAssets()`
- `unlockAssets()`

---

## Appendix B: Test Coverage Matrix

| Hook | Unit | Integration | E2E |
|------|------|-------------|-----|
| useTotalRaised | Y | Y | - |
| useHasMinted | Y | Y | Y |
| useSoftCap | Y | Y | - |
| useHardCap | Y | Y | - |
| useMint | Y | Y | Y |
| useTokenData | Y | Y | Y |
| useClaimCount | Y | Y | - |
| useTBAAddress | Y | Y | Y |
| useTBABalance | Y | Y | Y |
| useTBALocked | Y | Y | Y |
| useTBATransferERC20 | Y | Y | Y |
| useCloseFundraising | Y | - | - |
| useDistributeETH | Y | - | - |
| useSetBlacklistStatus | Y | - | - |
| usePauseProgram | Y | - | - |

Total: 50+ tests planned
