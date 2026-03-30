import type { NextFunction, Request, Response } from 'express';
import { verifySupabaseJwt } from '../lib/supabaseAuth.ts';

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
};

export async function requireSupabaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing Supabase access token.' });
  }

  const user = await verifySupabaseJwt(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired Supabase access token.' });
  }

  req.user = {
    id: user.sub,
    email: user.email,
    role: user.role,
  };

  return next();
}
