process.env.DATABASE_URL = 'file:./test.db';
process.env.PRIVY_BYPASS = 'true';
process.env.ADMIN_TOKEN = 'test-admin-token';

import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/prisma';

const adminHeader = { 'x-admin-token': process.env.ADMIN_TOKEN || '' };

const resetDb = async () => {
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Mint;');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Application;');
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS User;');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE Application (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      walletAddress TEXT NOT NULL,
      profilePicURL TEXT,
      twitter TEXT,
      status TEXT DEFAULT 'pending',
      metadataURI TEXT,
      mintedTokenId INTEGER UNIQUE,
      approvedAt DATETIME,
      appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      userRef INTEGER,
      FOREIGN KEY(userRef) REFERENCES User(id)
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE Mint (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenId INTEGER UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      accountAddress TEXT,
      metadataURI TEXT,
      metadata TEXT,
      mintedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      applicationId INTEGER NOT NULL,
      FOREIGN KEY(applicationId) REFERENCES Application(id)
    );
  `);
};

describe('EBT Express API (TS + Prisma)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('applies and stores a new application', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('authorization', 'Bearer privy-test')
      .send({ userId: 'user-1', username: 'alice', walletAddress: '0xabc' });

    expect(res.status).toBe(201);
    expect(res.body.application.userId).toBe('user-1');
    expect(res.body.application.status).toBe('pending');
  });

  test('rejects duplicate userId or username', async () => {
    await request(app)
      .post('/api/applications')
      .set('authorization', 'Bearer privy-test')
      .send({ userId: 'user-1', username: 'alice', walletAddress: '0xabc' });

    const res = await request(app)
      .post('/api/applications')
      .set('authorization', 'Bearer privy-test')
      .send({ userId: 'user-1', username: 'alice', walletAddress: '0xdef' });

    expect(res.status).toBe(409);
  });

  test('requires admin token to approve user', async () => {
    await request(app)
      .post('/api/applications')
      .set('authorization', 'Bearer privy-test')
      .send({ userId: 'user-1', username: 'alice', walletAddress: '0xabc' });

    const unauthorized = await request(app).post('/api/applications/user-1/approve');
    expect(unauthorized.status).toBe(401);

    const res = await request(app).post('/api/applications/user-1/approve').set(adminHeader);
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('approved');
    expect(res.body.application.approvedAt).toBeTruthy();
  });

  test('records mint metadata and retrieves it', async () => {
    await request(app)
      .post('/api/applications')
      .set('authorization', 'Bearer privy-test')
      .send({ userId: 'user-1', username: 'alice', walletAddress: '0xabc', status: 'approved' });

    const mintRes = await request(app)
      .post('/api/mints')
      .set(adminHeader)
      .send({ tokenId: 1, userId: 'user-1', metadataURI: 'ipfs://meta', metadata: { name: 'EBT #1' } });

    expect(mintRes.status).toBe(201);
    expect(mintRes.body.mint.tokenId).toBe(1);

    const metadataRes = await request(app).get('/api/metadata/1');
    expect(metadataRes.status).toBe(200);
    expect(metadataRes.body.metadata.name).toBe('EBT #1');
  });

  test('checkusername consults applications', async () => {
    await request(app)
      .post('/api/applications')
      .set('authorization', 'Bearer privy-test')
      .send({ userId: 'user-1', username: 'alice', walletAddress: '0xabc' });

    const available = await request(app).post('/api/checkusername').send({ username: 'bob' });
    expect(available.status).toBe(200);

    const taken = await request(app).post('/api/checkusername').send({ username: 'alice' });
    expect(taken.status).toBe(409);
  });

  test('update-user-data step 1 inserts application', async () => {
    const res = await request(app)
      .post('/update-user-data')
      .set('authorization', 'Bearer privy-test')
      .send({ step: 1, data: { username: 'charlie', userId: 'user-3' } });

    expect(res.status).toBe(200);
    expect(res.body.application.username).toBe('charlie');

    const appRecord = await prisma.application.findFirst({ where: { userId: 'user-3' } });
    expect(appRecord).not.toBeNull();
  });
});
