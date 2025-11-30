/**
 * Database Clear Script
 *
 * This script clears all user data from the database for a fresh start.
 * Run with: npx tsx scripts/clear-database.ts
 *
 * Or run directly with Prisma:
 * npx prisma db push --force-reset (WARNING: This drops all tables)
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Starting database clear...\n');

  try {
    // Delete in order of dependencies (most dependent first)

    console.log('Clearing SlotSpin...');
    const slotSpins = await prisma.slotSpin.deleteMany({});
    console.log(`  Deleted ${slotSpins.count} slot spins`);

    console.log('Clearing SlotStats...');
    const slotStats = await prisma.slotStats.deleteMany({});
    console.log(`  Deleted ${slotStats.count} slot stats`);

    console.log('Clearing GeneratedCard...');
    const generatedCards = await prisma.generatedCard.deleteMany({});
    console.log(`  Deleted ${generatedCards.count} generated cards`);

    console.log('Clearing WalletSnapshot...');
    const walletSnapshots = await prisma.walletSnapshot.deleteMany({});
    console.log(`  Deleted ${walletSnapshots.count} wallet snapshots`);

    console.log('Clearing Mint...');
    const mints = await prisma.mint.deleteMany({});
    console.log(`  Deleted ${mints.count} mints`);

    console.log('Clearing Application...');
    const applications = await prisma.application.deleteMany({});
    console.log(`  Deleted ${applications.count} applications`);

    console.log('Clearing User...');
    const users = await prisma.user.deleteMany({});
    console.log(`  Deleted ${users.count} users`);

    // Note: We keep configuration tables intact
    console.log('\n--- Configuration tables preserved: ---');
    console.log('  - ScoringConfig');
    console.log('  - NFTBoostConfig');
    console.log('  - TokenBoostConfig');
    console.log('  - BackgroundTheme');

    console.log('\n✅ Database cleared successfully!');
    console.log('\nNext steps:');
    console.log('1. Clear Privy test users from dashboard');
    console.log('2. Deploy new contracts');
    console.log('3. Update .env with new contract addresses');
    console.log('4. Run initialDistribution on FoodStamps contract');

  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
