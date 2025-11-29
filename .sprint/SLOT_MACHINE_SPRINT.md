# EBT SLOT MACHINE - SPRINT PLAN

**Sprint Start:** 2024-11-29
**Status:** IN PROGRESS

---

## VISION

Build a provably fair, on-chain slot machine called "THE GROCERY RUN" that:
- Gives EBT Card holders 10 free spins to win up to 5k $EBTC
- Allows infinite spins after free spins for jackpot-only mode
- Features grocery items and meme characters as symbols
- Integrates with points system and monthly provisions
- Uses Chainlink VRF for provably fair randomness

---

## PHASE 1: ASSET PREPARATION [IN PROGRESS]

### 1.1 Sprite Cutting
**Status:** IN PROGRESS

Extract individual icons from sprite sheets for use in slot machine.

**Source Sheets:**
| Sheet | Grid | Icon Size | Priority | Status |
|-------|------|-----------|----------|--------|
| `grocery-items.png` | 10x10 | ~100px | HIGH | PENDING |
| `pepe-actions.png` | 5x4 | ~200px | HIGH | PENDING |
| `doge-actions.png` | 4x4 | ~200px | HIGH | PENDING |
| `wojak-actions.png` | 5x4 | ~200px | MEDIUM | PENDING |
| `meme-shoppers.png` | 8x4 | ~150px | MEDIUM | PENDING |

**Output Location:** `frontend/public/slots/symbols/`

**Naming Convention:**
- Groceries: `grocery_{name}.png` (e.g., `grocery_apple.png`)
- Memes: `meme_{character}_{action}.png` (e.g., `meme_pepe_cart.png`)
- Special: `special_{type}.png` (e.g., `special_wild.png`)

### 1.2 Symbol Manifest
Create JSON manifest mapping symbol IDs to assets.

**File:** `frontend/src/lib/slots/symbols.json`

---

## PHASE 2: SMART CONTRACT [PENDING]

### 2.1 Contract Architecture

```
smart-contracts/foundry-src/
├── EBTSlotMachine.sol      # Main game contract
├── interfaces/
│   └── IEBTSlotMachine.sol # Interface
└── libraries/
    └── SlotMachineLib.sol  # Payout calculations
```

### 2.2 Core Features

**EBTSlotMachine.sol:**
```solidity
// Key state variables
mapping(uint256 => uint256) freeSpinsUsed;     // tokenId => spins
mapping(uint256 => uint256) totalWinnings;     // tokenId => $EBTC won
mapping(uint256 => SpinRequest) spinRequests;  // requestId => request

// Key functions
function spin(uint256 tokenId) external;           // Request spin
function fulfillRandomWords(...) internal;         // VRF callback
function claimWinnings(uint256 tokenId) external;  // Withdraw to TBA
```

### 2.3 VRF Integration
- Use Chainlink VRF V2.5 for randomness
- Base Sepolia: VRF Coordinator at `0x...`
- Request 1 random word per spin
- Extract 3 reel results from single uint256

### 2.4 Payout Logic
```
Symbol weights stored on-chain (uint8[])
Payout multipliers stored on-chain (uint16[])

calculatePayout(uint8 reel1, uint8 reel2, uint8 reel3):
  - Check three of a kind
  - Check wild combinations
  - Check scatter pays
  - Return payout amount
```

### 2.5 Testing Strategy
```bash
forge test --match-contract EBTSlotMachineTest -vvv
```

**Test Cases:**
- [ ] `testSpin_EBTHolderOnly` - Only NFT holders can spin
- [ ] `testSpin_FreeSpinLimit` - Max 10 free spins enforced
- [ ] `testSpin_FreeCap` - 5k max from free spins
- [ ] `testSpin_JackpotPayout` - Triple 7s pays jackpot
- [ ] `testSpin_WildSubstitution` - Wild works correctly
- [ ] `testSpin_VRFCallback` - Randomness applied correctly
- [ ] `testClaim_ToTBA` - Winnings go to token-bound account
- [ ] `testFuzz_PayoutCalculation` - Fuzz test payouts

---

## PHASE 3: BACKEND API [PENDING]

### 3.1 Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/slots/spin` | Record spin intent |
| GET | `/api/slots/result/:requestId` | Get spin result |
| GET | `/api/slots/history/:tokenId` | Get spin history |
| GET | `/api/slots/jackpot` | Get current jackpot |
| POST | `/api/slots/claim` | Trigger on-chain claim |

### 3.2 Database Schema

```prisma
model SlotSpin {
  id          String   @id @default(uuid())
  tokenId     Int
  userId      String
  requestId   String   @unique
  reels       Int[]    // [reel1, reel2, reel3]
  payout      Float
  isFree      Boolean
  isJackpot   Boolean  @default(false)
  txHash      String?
  createdAt   DateTime @default(now())
}
```

### 3.3 Event Listeners
- Listen to `SpinResult` events from contract
- Update database with results
- Trigger leaderboard/points updates

---

## PHASE 4: FRONTEND POLISH [PENDING]

### 4.1 Animation Improvements
- [ ] Waterfall reel animation with easing
- [ ] Symbol bounce on stop
- [ ] Win celebration particles
- [ ] Jackpot explosion effect
- [ ] Sound effects (optional)

### 4.2 Sprite Integration
- [ ] Replace emoji fallbacks with cut sprites
- [ ] Add hover effects on symbols
- [ ] Implement sprite-based payout table

### 4.3 Mobile Optimization
- [ ] Responsive reel sizing
- [ ] Touch-friendly spin button
- [ ] Landscape mode support

---

## PHASE 5: BONUS GAME [PENDING]

### 5.1 Trigger
- 3 BONUS symbols on payline
- Transition to bonus game modal

### 5.2 Game Options

**Option A: Pick-a-Box**
- 9 grocery bags displayed
- Player picks 3
- Each reveals $EBTC amount
- Uses meme shopper sprites as "hosts"

**Option B: Wheel of Fortune**
- Spinning wheel with multipliers
- Uses checkout background
- Meme characters react to result

**Option C: Free Spins**
- Award 5-10 free spins with 2x multiplier
- Different background during free spins
- Auto-spin feature

### 5.3 Assets Needed
- Bonus game backgrounds (from `backgrounds/`)
- Character reaction sprites (from `meme-shoppers.png`)
- Prize reveal animations

---

## PHASE 6: INTEGRATION [PENDING]

### 6.1 Leaderboard Connection
- Slot winnings add to user score
- Display slot stats on leaderboard
- "Luckiest Spinner" category

### 6.2 Provision Integration
- Slot winnings count toward monthly allocation
- Track slot-specific earnings
- Display in dashboard

### 6.3 Homepage Link
- Add "THE GROCERY RUN" to navbar
- Teaser on landing page
- Link from dashboard

---

## CURRENT SPRINT TASKS

### Sprint 1: Asset Preparation
- [x] Copy memecon sheets to frontend
- [x] Rename sheets descriptively
- [x] Copy background scenes
- [ ] **Cut grocery sprites (100+ icons)**
- [ ] **Cut meme character sprites (key poses)**
- [ ] **Create symbol manifest JSON**
- [ ] Update Symbol.tsx to use sprites

### Sprint 2: Smart Contract
- [ ] Create EBTSlotMachine.sol skeleton
- [ ] Implement spin() with VRF request
- [ ] Implement fulfillRandomWords callback
- [ ] Implement payout calculation
- [ ] Write comprehensive tests
- [ ] Deploy to Sepolia testnet

### Sprint 3: Integration
- [ ] Connect frontend to contract
- [ ] Add spin tracking API
- [ ] Update leaderboard with slot wins
- [ ] End-to-end testing

---

## ASSET CUTTING PLAN

### Priority 1: Slot Symbols (16 icons needed minimum)

**From grocery-items.png (Row, Col):**
| Symbol | Position | Filename |
|--------|----------|----------|
| Apple | 0,0 | `grocery_apple.png` |
| Orange | 0,2 | `grocery_orange.png` |
| Avocado | 0,8 | `grocery_avocado.png` |
| Blueberries | 1,0 | `grocery_blueberries.png` |
| Grapes | 1,4 | `grocery_grapes.png` |
| Watermelon | 1,5 | `grocery_watermelon.png` |
| Lemon | 1,6 | `grocery_lemon.png` |
| Milk | 2,0 | `grocery_milk.png` |
| Eggs | 2,2 | `grocery_eggs.png` |
| Cheese | 2,4 | `grocery_cheese.png` |
| Bread | 2,8 | `grocery_bread.png` |
| Cereal | 3,3 | `grocery_cereal.png` |

**From meme sheets:**
| Symbol | Sheet | Position | Filename |
|--------|-------|----------|----------|
| Pepe Cart | pepe-actions | 0,0 | `meme_pepe_cart.png` |
| Pepe STONKS | pepe-actions | 1,1 | `meme_pepe_stonks.png` |
| Pepe Bitcoin | pepe-actions | 3,1 | `meme_pepe_bitcoin.png` |
| Doge Cart | doge-actions | 0,0 | `meme_doge_cart.png` |
| Wojak Cart | wojak-actions | 0,0 | `meme_wojak_cart.png` |
| NPC | wojak-actions | 3,4 | `meme_npc.png` |

### Priority 2: Special Symbols
- [ ] Create custom 7 symbol
- [ ] Create EBT Card (Wild) symbol
- [ ] Create BONUS symbol
- [ ] Create LINDA (Scatter) symbol

---

## NOTES

- Sprite sheets are Gemini-generated, ~1000x1000px each
- Grid sizes vary by sheet - need to analyze each
- Some sheets have duplicate icons - pick best quality
- Background scenes are 1920x~800px panoramic

---

## BLOCKERS

None currently.

---

## DEPENDENCIES

- Chainlink VRF subscription on Base Sepolia
- Frontend build passing
- EBTProgram contract deployed

---

*Last Updated: 2024-11-29*
