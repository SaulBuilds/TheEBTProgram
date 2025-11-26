import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ==================== SCORING CONFIGURATION ====================
  const scoringConfigs = [
    // Social connections
    {
      name: 'twitter_connected',
      description: 'User has connected their Twitter account',
      weight: 100,
      category: 'social',
      enabled: true,
    },
    {
      name: 'discord_connected',
      description: 'User has connected their Discord account',
      weight: 100,
      category: 'social',
      enabled: true,
    },
    {
      name: 'telegram_connected',
      description: 'User has connected their Telegram account',
      weight: 100,
      category: 'social',
      enabled: true,
    },
    {
      name: 'github_connected',
      description: 'User has connected their GitHub account',
      weight: 150,
      category: 'social',
      enabled: true,
    },
    {
      name: 'email_verified',
      description: 'User has verified their email',
      weight: 50,
      category: 'social',
      enabled: true,
    },
    // Wallet metrics
    {
      name: 'eth_balance_tier1',
      description: 'User has >= 0.01 ETH in wallet',
      weight: 50,
      category: 'wallet',
      enabled: true,
      metadata: JSON.stringify({ minBalance: '10000000000000000' }), // 0.01 ETH in wei
    },
    {
      name: 'eth_balance_tier2',
      description: 'User has >= 0.1 ETH in wallet',
      weight: 100,
      category: 'wallet',
      enabled: true,
      metadata: JSON.stringify({ minBalance: '100000000000000000' }), // 0.1 ETH in wei
    },
    {
      name: 'eth_balance_tier3',
      description: 'User has >= 1 ETH in wallet',
      weight: 200,
      category: 'wallet',
      enabled: true,
      metadata: JSON.stringify({ minBalance: '1000000000000000000' }), // 1 ETH in wei
    },
    // NFT holding bonus (general)
    {
      name: 'nft_holder',
      description: 'User holds at least one NFT from boost list',
      weight: 150,
      category: 'nft',
      enabled: true,
    },
    // Token holding bonus (general)
    {
      name: 'token_holder',
      description: 'User holds tokens with liquidity from boost list',
      weight: 100,
      category: 'token',
      enabled: true,
    },
    // Hunger declaration bonuses
    {
      name: 'hunger_starving',
      description: 'User declared "Absolutely Starving" hunger level',
      weight: 50,
      category: 'application',
      enabled: true,
    },
    {
      name: 'dependents_bonus',
      description: 'Bonus per dependent (up to 5)',
      weight: 20,
      category: 'application',
      enabled: true,
      metadata: JSON.stringify({ maxDependents: 5 }),
    },
  ];

  for (const config of scoringConfigs) {
    await prisma.scoringConfig.upsert({
      where: { name: config.name },
      update: config,
      create: config,
    });
  }
  console.log(`Created ${scoringConfigs.length} scoring configs`);

  // ==================== BACKGROUND THEMES ====================
  const backgroundThemes = [
    {
      name: 'rust_belt',
      description: 'Abandoned factories and rusted infrastructure',
      zipPatterns: JSON.stringify(['481*', '482*', '440*', '441*', '152*']), // Detroit, Cleveland, Pittsburgh
      promptHints: 'abandoned factory, rusted steel beams, overcast sky, industrial decay, crumbling brick buildings, midwest americana, gritty urban landscape',
    },
    {
      name: 'trailer_park',
      description: 'Mobile home community aesthetic',
      zipPatterns: JSON.stringify(['321*', '327*', '386*', '723*']), // Florida, Mississippi, Arkansas
      promptHints: 'trailer park, mobile homes, dirt road, chain link fence, overgrown weeds, pickup trucks, lawn chairs, satellite dishes, americana poverty',
    },
    {
      name: 'urban_decay',
      description: 'Inner city blight and abandonment',
      zipPatterns: JSON.stringify(['606*', '607*', '212*', '215*']), // Chicago South Side, Baltimore, Philadelphia
      promptHints: 'boarded up buildings, graffiti covered walls, broken windows, empty lot, liquor store, check cashing place, urban blight, concrete jungle',
    },
    {
      name: 'coal_country',
      description: 'Appalachian mining towns',
      zipPatterns: JSON.stringify(['247*', '248*', '417*', '418*']), // West Virginia, Kentucky
      promptHints: 'coal mining town, mountain backdrop, company store, railroad tracks, modest wooden houses, foggy morning, appalachian poverty',
    },
    {
      name: 'dollar_store_district',
      description: 'Strip mall and dollar store dominated areas',
      zipPatterns: JSON.stringify(['*']), // Default/fallback
      promptHints: 'strip mall parking lot, dollar store, pawn shop, payday loans sign, fast food restaurants, power lines, suburban decay, concrete and asphalt',
    },
  ];

  for (const theme of backgroundThemes) {
    await prisma.backgroundTheme.upsert({
      where: { name: theme.name },
      update: theme,
      create: theme,
    });
  }
  console.log(`Created ${backgroundThemes.length} background themes`);

  // ==================== SAMPLE NFT BOOST CONFIG ====================
  // These are example Sepolia testnet contracts - replace with real addresses
  const nftBoostConfigs = [
    {
      contractAddress: '0x0000000000000000000000000000000000000001', // Placeholder
      chainId: 11155111,
      name: 'OG Degen NFT',
      symbol: 'OGDEGEN',
      boostPoints: 500,
      minBalance: 1,
      enabled: false, // Disabled until real address added
    },
  ];

  for (const config of nftBoostConfigs) {
    await prisma.nFTBoostConfig.upsert({
      where: { contractAddress: config.contractAddress },
      update: config,
      create: config,
    });
  }
  console.log(`Created ${nftBoostConfigs.length} NFT boost configs`);

  // ==================== SAMPLE TOKEN BOOST CONFIG ====================
  const tokenBoostConfigs = [
    {
      contractAddress: '0x0000000000000000000000000000000000000002', // Placeholder
      chainId: 11155111,
      name: 'Sample Token',
      symbol: 'SAMPLE',
      boostPoints: 100,
      minBalanceUSD: 100,
      minLiquidityUSD: 5000,
      enabled: false, // Disabled until real address added
    },
  ];

  for (const config of tokenBoostConfigs) {
    await prisma.tokenBoostConfig.upsert({
      where: { contractAddress: config.contractAddress },
      update: config,
      create: config,
    });
  }
  console.log(`Created ${tokenBoostConfigs.length} token boost configs`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
