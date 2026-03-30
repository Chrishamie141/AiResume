import type { NextFunction, Request, Response } from 'express';
import { hasFirebaseTokenVerifier, verifyFirebaseIdToken } from './firebaseAdmin.ts';

type AuthenticatedRequest = Request & {
  firebaseUser?: {
    uid: string;
    email?: string;
    displayName?: string;
  };
};

export async function requireFirebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!hasFirebaseTokenVerifier) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase ID token.' });
  }

  const user = await verifyFirebaseIdToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
  }

  req.firebaseUser = user;
  return next();
}
