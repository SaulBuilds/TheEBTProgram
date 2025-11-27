import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load Vercel/Production environment - pass your DATABASE_URL via command line
// Usage: DATABASE_URL="your-vercel-postgres-url" npx ts-node scripts/reset-production-db.ts

const prisma = new PrismaClient();

async function resetProductionDatabase() {
  console.log('=== PRODUCTION DATABASE RESET ===\n');
  console.log('WARNING: This will delete ALL data from the database!\n');

  // Show current counts before deletion
  const counts = {
    applications: await prisma.application.count(),
    users: await prisma.user.count(),
    mints: await prisma.mint.count(),
    generatedCards: await prisma.generatedCard.count(),
    walletSnapshots: await prisma.walletSnapshot.count(),
  };

  console.log('Current data counts:');
  console.log(`  Applications: ${counts.applications}`);
  console.log(`  Users: ${counts.users}`);
  console.log(`  Mints: ${counts.mints}`);
  console.log(`  Generated Cards: ${counts.generatedCards}`);
  console.log(`  Wallet Snapshots: ${counts.walletSnapshots}`);
  console.log('');

  // Delete in proper order (respecting foreign keys)
  console.log('Deleting data...\n');

  // Delete Mints first (references Application)
  const deletedMints = await prisma.mint.deleteMany({});
  console.log(`Deleted ${deletedMints.count} Mint records`);

  // Delete GeneratedCards (references Application)
  const deletedCards = await prisma.generatedCard.deleteMany({});
  console.log(`Deleted ${deletedCards.count} GeneratedCard records`);

  // Delete WalletSnapshots (references Application)
  const deletedSnapshots = await prisma.walletSnapshot.deleteMany({});
  console.log(`Deleted ${deletedSnapshots.count} WalletSnapshot records`);

  // Delete Applications (references User)
  const deletedApps = await prisma.application.deleteMany({});
  console.log(`Deleted ${deletedApps.count} Application records`);

  // Delete Users
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`Deleted ${deletedUsers.count} User records`);

  console.log('\n=== DATABASE RESET COMPLETE ===');
  console.log('\nNote: Scoring configs, NFT/Token boost configs, and background themes are preserved.');
  console.log('These are system configuration, not user data.');
}

resetProductionDatabase()
  .catch((error) => {
    console.error('Error resetting database:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
