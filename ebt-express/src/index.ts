import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { app as routerApp } from './app';
import { prisma } from './prisma';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);

app.use(helmet());
app.use(routerApp);

export const start = async () => {
  const port = Number(process.env.PORT || 8080);
  await prisma.$connect();
  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running on http://localhost:${port}`);
      resolve();
    });
  });
};

if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Unable to start server', err);
    process.exit(1);
  });
}

export { app };
