import { Request, Response, NextFunction } from 'express';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.header('x-admin-token') === ADMIN_TOKEN) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};
