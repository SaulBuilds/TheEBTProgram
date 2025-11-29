# Sprint 002: Standalone Slot Machine Refactor

## Overview
Refactor EBTSlotMachine.sol to be standalone and composable, removing the tight coupling with EBTProgram. The slot machine will emit events that can be indexed by an off-chain scoring system.

## Rationale
Per discussion: The slot machine should be standalone and composable, used to inject data into the off-chain scoring system rather than requiring EBT NFT ownership.

## Current Architecture
```
EBTSlotMachine
    └── requires EBTProgram.ownerOf(tokenId) == msg.sender
    └── tracks stats by tokenId (EBT NFT)
    └── pays out $EBTC to player wallet
```

## Proposed Architecture
```
EBTSlotMachine (Standalone)
    └── any wallet can spin
    └── tracks stats by player address (not tokenId)
    └── emits events for off-chain indexing
    └── optional: integrate with leaderboard contract
```

## Changes

### 1. Remove EBTProgram Dependency
**File:** `contracts/EBTSlotMachine.sol`

**Before:**
```solidity
IERC721 public immutable ebtProgram;

constructor(address _ebtProgram, address _foodStamps) {
    ebtProgram = IERC721(_ebtProgram);
    // ...
}

function spin(uint256 tokenId) external {
    if (ebtProgram.ownerOf(tokenId) != msg.sender) {
        revert NotEBTHolder();
    }
    // ...
}
```

**After:**
```solidity
// No ebtProgram reference

constructor(address _foodStamps) {
    // Only needs FoodStamps token
}

function spin() external {
    // Any wallet can spin
    // Stats tracked by msg.sender
}
```

### 2. Change Stats Tracking from TokenId to Address
**Before:**
```solidity
mapping(uint256 => PlayerStats) public playerStats;
mapping(uint256 => uint256) public pendingSpinRequest;
```

**After:**
```solidity
mapping(address => PlayerStats) public playerStats;
mapping(address => uint256) public pendingSpinRequest;
```

### 3. Enhanced Events for Off-chain Indexing
**Add new events:**
```solidity
event SpinCompleted(
    address indexed player,
    uint256 indexed requestId,
    uint8 reel1,
    uint8 reel2,
    uint8 reel3,
    uint256 payout,
    bool isJackpot,
    uint256 timestamp
);

event PlayerStatsUpdated(
    address indexed player,
    uint256 totalSpins,
    uint256 totalWinnings,
    uint256 freeSpinsUsed
);
```

### 4. Optional EBT NFT Holder Bonus
Instead of requiring EBT ownership, provide a bonus multiplier:
```solidity
IERC721 public ebtProgram; // Optional, can be address(0)

function spin() external {
    // Base gameplay for everyone
    uint256 baseMultiplier = 100; // 1x

    // Bonus for EBT holders
    if (address(ebtProgram) != address(0) && ebtProgram.balanceOf(msg.sender) > 0) {
        baseMultiplier = 150; // 1.5x bonus for EBT holders
    }

    // ...
}
```

### 5. Update Function Signatures
| Old | New |
|-----|-----|
| `spin(uint256 tokenId)` | `spin()` |
| `getPlayerStats(uint256 tokenId)` | `getPlayerStats(address player)` |
| `getRemainingFreeSpins(uint256 tokenId)` | `getRemainingFreeSpins(address player)` |
| `canSpin(uint256 tokenId)` | `canSpin(address player)` |

### 6. Update Tests
**File:** `foundry-test/EBTSlotMachine.t.sol`

- Remove EBTProgram deployment from setUp
- Remove NFT minting for players
- Update all test calls to use address instead of tokenId
- Simplify test setup significantly

## Migration Path
1. Deploy new standalone EBTSlotMachine
2. Fund with $EBTC for payouts
3. Update frontend to call new contract
4. Deprecate old contract (if deployed)

## Files to Modify
1. `contracts/EBTSlotMachine.sol` - Main contract changes
2. `foundry-test/EBTSlotMachine.t.sol` - Simplified tests
3. `contracts/interfaces/IEBTSlotMachine.sol` - New interface (optional)

## Testing Checklist
- [ ] Any wallet can spin
- [ ] Stats tracked correctly by address
- [ ] Free spin limits work per address
- [ ] Payouts work correctly
- [ ] Events emitted for indexing
- [ ] Optional EBT holder bonus works
- [ ] All existing test scenarios still covered

## Estimated Changes
- ~50 lines modified in contract
- ~100 lines simplified in tests
- Net reduction in complexity
