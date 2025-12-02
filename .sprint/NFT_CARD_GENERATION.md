# NFT Card Generation & IPFS Metadata System

## Overview

This sprint covers the automated generation of EBT Card NFT images and metadata, including:
1. Dynamic card image generation with user avatar and memetic backgrounds
2. Metadata packaging conforming to ERC-721 standards
3. IPFS pinning via user's node
4. Integration with the minting flow

---

## Architecture

### Option A: Vercel Serverless Functions (Recommended)

**Pros:**
- Seamless integration with existing Next.js app
- Automatic scaling
- No additional infrastructure needed
- Edge functions for low latency

**Cons:**
- 10-second execution limit on hobby plan (50s on Pro)
- 4.5MB max response size

**Implementation:**
```
/api/cards/generate/[userId] - Generates card image
/api/metadata/generate/[userId] - Creates and pins metadata
/api/cards/pin - Pins to IPFS
```

### Option B: Dedicated Backend Service

**Pros:**
- No execution time limits
- More control over resources
- Can handle heavy image processing

**Cons:**
- Additional infrastructure to manage
- Separate deployment

---

## Card Generation Flow

### 1. Pre-Approval (Admin generates card)

```
Admin approves user
  ↓
Backend generates card image:
  - Fetch user's avatar from Privy/social
  - Select/generate memetic background
  - Composite: background + avatar + user info
  - Export as PNG
  ↓
Pin image to IPFS
  ↓
Generate metadata JSON with image CID
  ↓
Pin metadata to IPFS
  ↓
Store metadata CID in database (GeneratedCard table)
  ↓
User can view preview on approval page
```

### 2. Mint Time

```
User initiates mint
  ↓
Contract mints NFT with baseTokenURI
  ↓
Metadata served via /api/metadata/[tokenId]
  ↓
OpenSea/marketplaces fetch metadata
```

---

## Card Image Specifications

### Dimensions
- **Size:** 1586 x 1000 pixels (credit card ratio 1.586:1)
- **Format:** PNG with transparency support
- **Max file size:** 2MB (for fast IPFS loading)

### Layout Structure
```
┌────────────────────────────────────────────┐
│                                            │
│   ┌────────┐    EBT CARD                  │
│   │ AVATAR │    ──────────                │
│   │  IMG   │    Username: {username}       │
│   └────────┘    Card #: {tokenId}          │
│                 Score: {welfareScore}      │
│                                            │
│   {MEMETIC BACKGROUND IMAGE}               │
│                                            │
│   ────────────────────────────────────     │
│   ELECTRONIC BENEFITS TRANSFER             │
│                                            │
└────────────────────────────────────────────┘
```

### Dynamic Elements
1. **User Avatar** (128x128)
   - Source: Privy profile, Twitter, or generated
   - Fallback: DiceBear pixel art
   - Position: Top-left quadrant

2. **Username** - User's chosen display name

3. **Token ID** - Assigned at mint time (can be placeholder pre-mint)

4. **Welfare Score** - From application scoring system

5. **Background Theme** - From BackgroundTheme table
   - Categories: Doomers, Wojaks, Pepes, Abstract
   - Randomly assigned or based on score

---

## Memetic Background System

### Background Sources
1. **Pre-curated library** (Phase 1)
   - 50-100 high-quality meme backgrounds
   - Stored in `/public/backgrounds/` or IPFS
   - Categories with mood/vibe tagging

2. **AI-generated** (Phase 2, optional)
   - Use DALL-E or Stable Diffusion API
   - Prompt: "Surreal welfare state meme background, {theme}"
   - Generate on-demand or batch pre-generate

### Background Assignment Logic
```typescript
function selectBackground(score: number, theme?: string): BackgroundTheme {
  // Score-based selection
  if (score >= 80) return getBackground('rare'); // Top tier
  if (score >= 50) return getBackground('uncommon');
  return getBackground('common');

  // Or random within tier
}
```

---

## IPFS Integration

### Pinning Strategy

**Option 1: User's IPFS Node**
```typescript
// Configure IPFS node endpoint
const IPFS_API = process.env.IPFS_NODE_URL; // e.g., http://localhost:5001

async function pinToIPFS(content: Buffer | string): Promise<string> {
  const response = await fetch(`${IPFS_API}/api/v0/add`, {
    method: 'POST',
    body: content,
  });
  const { Hash } = await response.json();
  return Hash; // CID
}
```

**Option 2: Pinata/NFT.Storage (Backup)**
```typescript
const pinata = new PinataClient({
  apiKey: process.env.PINATA_API_KEY,
  secretKey: process.env.PINATA_SECRET,
});

async function pinWithPinata(content: Buffer, name: string): Promise<string> {
  const result = await pinata.pinFileToIPFS(content, {
    pinataMetadata: { name },
  });
  return result.IpfsHash;
}
```

### Metadata Structure (ERC-721)
```json
{
  "name": "EBT Card #42",
  "description": "Electronic Benefits Transfer Card for the blockchain breadline. Welcome to The Program.",
  "image": "ipfs://Qm.../card.png",
  "external_url": "https://ebtcard.xyz/card/42",
  "attributes": [
    { "trait_type": "Username", "value": "degen_farmer" },
    { "trait_type": "Welfare Score", "value": 69 },
    { "trait_type": "Background", "value": "Doomer Sunset" },
    { "trait_type": "Rarity", "value": "Uncommon" },
    { "trait_type": "Mint Date", "value": "2025-12-01" },
    { "trait_type": "Claims Remaining", "value": 3, "display_type": "number" }
  ],
  "background_color": "000000"
}
```

---

## Implementation Steps

### Phase 1: Core Generation (Sprint 1)

1. **Create card generation API route**
   ```
   /api/cards/generate/[userId]/route.ts
   ```
   - Accept userId, fetch user data
   - Use Sharp or Canvas to composite image
   - Return base64 or buffer

2. **Create IPFS pinning service**
   ```
   /lib/services/ipfs.ts
   ```
   - Support multiple providers
   - Retry logic
   - CID caching

3. **Create metadata generation**
   ```
   /api/metadata/generate/[userId]/route.ts
   ```
   - Build metadata JSON
   - Pin to IPFS
   - Store CID in database

4. **Update admin approval flow**
   - After approval, trigger card generation
   - Store GeneratedCard record

5. **Update contract metadata endpoint**
   ```
   /api/metadata/[tokenId]/route.ts
   ```
   - Serve metadata from database or generate on-demand

### Phase 2: Background Library (Sprint 2)

1. Curate 50+ background images
2. Upload to IPFS
3. Create BackgroundTheme records
4. Implement selection algorithm

### Phase 3: Enhanced Features (Future)

1. AI-generated backgrounds
2. Animated card support
3. Card customization options
4. Rarity system

---

## Database Schema Updates

Already in schema.prisma:
```prisma
model GeneratedCard {
  id           Int      @id @default(autoincrement())
  userId       String   @unique
  imageCid     String
  metadataCid  String
  imageUrl     String
  metadataUrl  String
  theme        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model BackgroundTheme {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  category    String
  ipfsCid     String
  rarity      String   @default("common")
  isActive    Boolean  @default(true)
}
```

---

## Environment Variables Required

```env
# IPFS Node
IPFS_NODE_URL=http://localhost:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Backup Pinning (optional)
PINATA_API_KEY=
PINATA_SECRET=

# Image Generation
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## API Endpoints

### POST /api/cards/generate/[userId]
Generates card image for approved user.

**Request:**
```json
{ "regenerate": false }
```

**Response:**
```json
{
  "success": true,
  "imageCid": "QmXyz...",
  "imageUrl": "ipfs://QmXyz..."
}
```

### POST /api/metadata/generate/[userId]
Generates and pins metadata.

**Response:**
```json
{
  "success": true,
  "metadataCid": "QmAbc...",
  "metadataUrl": "ipfs://QmAbc..."
}
```

### GET /api/metadata/[tokenId]
Returns metadata for token (called by marketplaces).

**Response:**
```json
{
  "name": "EBT Card #42",
  "image": "ipfs://Qm...",
  ...
}
```

---

## Testing Checklist

- [ ] Card generation produces valid PNG
- [ ] IPFS pinning succeeds with user's node
- [ ] Fallback to Pinata works
- [ ] Metadata is valid ERC-721 format
- [ ] OpenSea displays card correctly
- [ ] Avatar fetch handles missing images
- [ ] Background selection is deterministic for same user
- [ ] Generated cards persist across reloads

---

## Security Considerations

1. **Rate limiting** on generation endpoints
2. **Admin-only** access to bulk generation
3. **Validate** userId ownership before generation
4. **Sanitize** user input in metadata
5. **IPFS CID** validation before storing

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Card generation API | 4-6 hours |
| IPFS service | 2-3 hours |
| Metadata generation | 2-3 hours |
| Admin flow integration | 2-3 hours |
| Background library | 3-4 hours |
| Testing & polish | 3-4 hours |
| **Total** | **16-23 hours** |

---

## Next Steps

1. Confirm IPFS node setup and API endpoint
2. Design final card template (Figma/sketch)
3. Curate initial background library
4. Implement Phase 1
5. Test with real mint flow
