-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "profilePicURL" TEXT,
    "twitter" TEXT,
    "discord" TEXT,
    "telegram" TEXT,
    "github" TEXT,
    "email" TEXT,
    "zipCode" TEXT,
    "hungerLevel" TEXT,
    "monthlyIncome" TEXT,
    "dependents" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "scoreBreakdown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadataURI" TEXT,
    "imageURI" TEXT,
    "mintedTokenId" INTEGER,
    "approvedAt" DATETIME,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userRef" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_userRef_fkey" FOREIGN KEY ("userRef") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "accountAddress" TEXT,
    "metadataURI" TEXT,
    "metadata" TEXT,
    "txHash" TEXT,
    "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" INTEGER NOT NULL,
    CONSTRAINT "Mint_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NFTBoostConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "boostPoints" INTEGER NOT NULL DEFAULT 100,
    "minBalance" INTEGER NOT NULL DEFAULT 1,
    "maxBoost" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "imageURL" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TokenBoostConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "boostPoints" INTEGER NOT NULL DEFAULT 50,
    "minBalanceUSD" REAL NOT NULL DEFAULT 100,
    "minLiquidityUSD" REAL NOT NULL DEFAULT 5000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "imageURL" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WalletSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER NOT NULL,
    "ethBalance" TEXT NOT NULL,
    "nftHoldings" TEXT,
    "tokenHoldings" TEXT,
    "nftBoostTotal" INTEGER NOT NULL DEFAULT 0,
    "tokenBoostTotal" INTEGER NOT NULL DEFAULT 0,
    "snapshotAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletSnapshot_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BackgroundTheme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "zipPatterns" TEXT NOT NULL,
    "promptHints" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GeneratedCard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER NOT NULL,
    "imageCid" TEXT NOT NULL,
    "metadataCid" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "metadataUrl" TEXT NOT NULL,
    "prompt" TEXT,
    "theme" TEXT,
    "badges" TEXT,
    "traits" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedCard_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_key" ON "Application"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_username_key" ON "Application"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Application_mintedTokenId_key" ON "Application"("mintedTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Mint_tokenId_key" ON "Mint"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringConfig_name_key" ON "ScoringConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NFTBoostConfig_contractAddress_key" ON "NFTBoostConfig"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBoostConfig_contractAddress_key" ON "TokenBoostConfig"("contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WalletSnapshot_applicationId_key" ON "WalletSnapshot"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "BackgroundTheme_name_key" ON "BackgroundTheme"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedCard_applicationId_key" ON "GeneratedCard"("applicationId");
