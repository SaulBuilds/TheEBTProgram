# Production Deployment Checklist

## Pre-Deployment Steps

### 1. Clear Test Data

#### Database (Vercel/Prisma)
```bash
# Option A: Run the clear script (keeps schema)
cd frontend
npx ts-node scripts/clear-database.ts

# Option B: Force reset (drops and recreates all tables)
npx prisma db push --force-reset
```

#### Privy Dashboard
- [ ] Log into Privy dashboard
- [ ] Navigate to Users section
- [ ] Delete all test users
- [ ] Clear any test API keys if needed

---

## Contract Deployment

### 2. Deploy Contracts (In Order)

Deploy from `smart-contracts/` directory using Foundry:

```bash
cd TheEBTProgram/smart-contracts
```

**Deployment Order Matters!** Some contracts depend on others.

#### Step 1: Deploy FoodStamps (ERC20 Token)
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/FoodStamps.sol:FoodStamps
```
Save: `FOOD_STAMPS_ADDRESS`

#### Step 2: Deploy ERC6551Registry
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/ERC6551Registry.sol:ERC6551Registry
```
Save: `ERC6551_REGISTRY_ADDRESS`

#### Step 3: Deploy ERC6551Account (Implementation)
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/ERC6551Account.sol:ERC6551Account
```
Save: `ERC6551_ACCOUNT_ADDRESS`

#### Step 4: Deploy TeamVesting
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/TeamVesting.sol:TeamVesting \
  --constructor-args $FOOD_STAMPS_ADDRESS
```
Save: `TEAM_VESTING_ADDRESS`

#### Step 5: Deploy LiquidityVault
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/LiquidityVault.sol:LiquidityVault \
  --constructor-args $FOOD_STAMPS_ADDRESS
```
Save: `LIQUIDITY_VAULT_ADDRESS`

#### Step 6: Deploy EBTApplication
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/EBTApplication.sol:EBTApplication
```
Save: `EBT_APPLICATION_ADDRESS`

#### Step 7: Deploy EBTProgram (Main NFT Contract)
```bash
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY \
  contracts/EBTProgram.sol:EBTProgram \
  --constructor-args $ERC6551_REGISTRY_ADDRESS $ERC6551_ACCOUNT_ADDRESS $EBT_APPLICATION_ADDRESS
```
Save: `EBT_PROGRAM_ADDRESS`

---

### 3. Post-Deployment Configuration

**CRITICAL: These steps must be done in order!**

#### Step 1: Initialize FoodStamps Token Distribution
Call `FoodStamps.initialDistribution()` with:
```
_liquidityVault: LIQUIDITY_VAULT_ADDRESS
_teamVesting: TEAM_VESTING_ADDRESS
_marketingWallet: YOUR_MARKETING_WALLET_ADDRESS
_ebtProgram: EBT_PROGRAM_ADDRESS
```

This mints:
- 13B tokens to LiquidityVault (65%)
- 4B tokens to Marketing Wallet (20%)
- 2B tokens to EBTProgram for TGE airdrops (10%)
- 1B tokens to TeamVesting (5%)

#### Step 2: Configure LiquidityVault
Call `LiquidityVault.setEBTProgram()` with:
```
_ebtProgram: EBT_PROGRAM_ADDRESS
```

#### Step 3: Initialize EBTProgram
Call `EBTProgram.initialize()` with:
```
_liquidityVault: LIQUIDITY_VAULT_ADDRESS
_protocolCaller: YOUR_PROTOCOL_CALLER_ADDRESS (for claims)
_treasury: YOUR_TREASURY_ADDRESS
_marketing: YOUR_MARKETING_WALLET_ADDRESS
_team: YOUR_TEAM_ADDRESS
_foodToken: FOOD_STAMPS_ADDRESS
_baseTokenURI: "https://your-api.com/api/metadata/"
```

#### Step 4: Set EBTApplication as Minter
Call `EBTApplication.setEBTProgram()` with:
```
_ebtProgram: EBT_PROGRAM_ADDRESS
```

#### Step 5: Grant Minter Role on EBTApplication
Call `EBTApplication.grantRole(MINTER_ROLE, YOUR_BACKEND_WALLET)`

---

### 4. Update Frontend Configuration

Edit `frontend/src/lib/contracts/addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  [SEPOLIA_CHAIN_ID]: {
    EBTProgram: 'NEW_EBT_PROGRAM_ADDRESS' as \`0x\${string}\`,
    FoodStamps: 'NEW_FOOD_STAMPS_ADDRESS' as \`0x\${string}\`,
    ERC6551Registry: 'NEW_REGISTRY_ADDRESS' as \`0x\${string}\`,
    ERC6551Account: 'NEW_ACCOUNT_ADDRESS' as \`0x\${string}\`,
    EBTApplication: 'NEW_APPLICATION_ADDRESS' as \`0x\${string}\`,
    LiquidityVault: 'NEW_VAULT_ADDRESS' as \`0x\${string}\`,
    TeamVesting: 'NEW_VESTING_ADDRESS' as \`0x\${string}\`,
    EBTSlotMachine: '0x0000000000000000000000000000000000000000' as \`0x\${string}\`,
  },
} as const;

export const DEPLOYMENT_INFO = {
  chainId: SEPOLIA_CHAIN_ID,
  blockNumber: NEW_BLOCK_NUMBER,
  timestamp: 'YYYY-MM-DD',
  deployer: 'YOUR_DEPLOYER_ADDRESS',
};
```

---

### 5. Update Vercel Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

```
EBT_PROGRAM_ADDRESS=NEW_ADDRESS
EBT_APPLICATION_ADDRESS=NEW_ADDRESS
FOOD_STAMPS_ADDRESS=NEW_ADDRESS
ERC6551_REGISTRY_ADDRESS=NEW_ADDRESS
ERC6551_ACCOUNT_ADDRESS=NEW_ADDRESS
LIQUIDITY_VAULT_ADDRESS=NEW_ADDRESS
```

---

### 6. Regenerate ABIs

After deployment, update ABIs in frontend:

```bash
cd smart-contracts

# Rebuild to ensure latest ABIs
forge build

# Copy ABIs to frontend
cat out/EBTProgram.sol/EBTProgram.json | jq '.abi' > ../frontend/src/lib/contracts/abis/EBTProgram.json
cat out/EBTApplication.sol/EBTApplication.json | jq '.abi' > ../frontend/src/lib/contracts/abis/EBTApplication.json
cat out/FoodStamps.sol/FoodStamps.json | jq '.abi' > ../frontend/src/lib/contracts/abis/FoodStamps.json
cat out/ERC6551Account.sol/ERC6551Account.json | jq '.abi' > ../frontend/src/lib/contracts/abis/ERC6551Account.json
cat out/ERC6551Registry.sol/ERC6551Registry.json | jq '.abi' > ../frontend/src/lib/contracts/abis/ERC6551Registry.json
cat out/LiquidityVault.sol/LiquidityVault.json | jq '.abi' > ../frontend/src/lib/contracts/abis/LiquidityVault.json
cat out/TeamVesting.sol/TeamVesting.json | jq '.abi' > ../frontend/src/lib/contracts/abis/TeamVesting.json
```

---

## Verification Checklist

After deployment, verify:

- [ ] FoodStamps has correct allocations:
  - [ ] LiquidityVault: 13,000,000,000 tokens
  - [ ] Marketing: 4,000,000,000 tokens
  - [ ] EBTProgram: 2,000,000,000 tokens
  - [ ] TeamVesting: 1,000,000,000 tokens

- [ ] EBTProgram is initialized:
  - [ ] `initialized()` returns true
  - [ ] `isFullyConfigured()` returns true

- [ ] LiquidityVault is configured:
  - [ ] `ebtProgram()` returns correct address

- [ ] Test mint flow:
  - [ ] Apply for EBT (registers on EBTApplication)
  - [ ] Admin approves user
  - [ ] User can mint from frontend
  - [ ] TBA is created
  - [ ] Tokens are distributed to TBA

---

## Contract Addresses Template

After deployment, record here:

| Contract | Address | Etherscan |
|----------|---------|-----------|
| FoodStamps | `0x...` | [Link]() |
| ERC6551Registry | `0x...` | [Link]() |
| ERC6551Account | `0x...` | [Link]() |
| TeamVesting | `0x...` | [Link]() |
| LiquidityVault | `0x...` | [Link]() |
| EBTApplication | `0x...` | [Link]() |
| EBTProgram | `0x...` | [Link]() |

---

## Rollback Plan

If something goes wrong:

1. Pause EBTProgram: `EBTProgram.pause()`
2. Investigate issue
3. If contract bug: Redeploy and migrate data
4. If config issue: Call appropriate setter function

---

## Important Notes

- **Rate Limiting Removed**: Multiple users can mint concurrently (no 30-second cooldown)
- **Mint Protection**: Users can only mint once per wallet, must be approved on-chain
- **Token Distribution**: Happens automatically at mint via LiquidityVault
- **TGE Airdrop**: 2B tokens reserved in EBTProgram for TGE claims
