import { AuthContext } from '../middleware/auth';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}
