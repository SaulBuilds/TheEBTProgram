import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function clearTestAccounts() {
  // First, list ALL existing applications
  console.log('=== ALL APPLICATIONS IN DATABASE ===\n');
  const allApps = await prisma.application.findMany({
    select: {
      username: true,
      userId: true,
      walletAddress: true,
      status: true,
      twitter: true,
    },
  });

  if (allApps.length === 0) {
    console.log('No applications found in database.\n');
  } else {
    for (const app of allApps) {
      console.log(`Username: ${app.username}`);
      console.log(`  userId: ${app.userId}`);
      console.log(`  wallet: ${app.walletAddress}`);
      console.log(`  twitter: ${app.twitter || 'N/A'}`);
      console.log(`  status: ${app.status}\n`);
    }
  }

  // List of usernames to delete (add any test accounts here)
  // Note: usernames are case-sensitive!
  const testUsernames = ['weenie', 'Saully', 'SaulBuilds', 'Saul', 'Breadlord69'];

  console.log('Starting cleanup of test accounts...\n');

  for (const username of testUsernames) {
    try {
      // Find the application
      const app = await prisma.application.findUnique({
        where: { username },
        include: {
          generatedCard: true,
          walletSnapshot: true,
          mints: true,
        },
      });

      if (!app) {
        console.log(`No application found for username: ${username}`);
        continue;
      }

      console.log(`Found application for ${username}:`);
      console.log(`  - userId: ${app.userId}`);
      console.log(`  - walletAddress: ${app.walletAddress}`);
      console.log(`  - status: ${app.status}`);

      // Delete related records first (due to foreign key constraints)
      if (app.generatedCard) {
        await prisma.generatedCard.delete({ where: { applicationId: app.id } });
        console.log(`  - Deleted GeneratedCard`);
      }

      if (app.walletSnapshot) {
        await prisma.walletSnapshot.delete({ where: { applicationId: app.id } });
        console.log(`  - Deleted WalletSnapshot`);
      }

      if (app.mints.length > 0) {
        await prisma.mint.deleteMany({ where: { applicationId: app.id } });
        console.log(`  - Deleted ${app.mints.length} Mint record(s)`);
      }

      // Delete the application
      await prisma.application.delete({ where: { id: app.id } });
      console.log(`  - Deleted Application`);

      // Delete the User if exists and has no other applications
      if (app.userRef) {
        const userAppsCount = await prisma.application.count({
          where: { userRef: app.userRef },
        });
        if (userAppsCount === 0) {
          await prisma.user.delete({ where: { id: app.userRef } });
          console.log(`  - Deleted User`);
        }
      }

      console.log(`\n✅ Successfully deleted ${username}\n`);
    } catch (error) {
      console.error(`❌ Error deleting ${username}:`, error);
    }
  }

  console.log('\nCleanup complete!');
  console.log('\n⚠️  NOTE: This only clears the DATABASE.');
  console.log('The on-chain data (EBTApplication contract) still has these userIds registered.');
  console.log('You may need to use different userIds when re-registering, or redeploy contracts for a fresh start.');
}

clearTestAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
