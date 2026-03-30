import jwt from 'jsonwebtoken';

const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!jwtSecret) {
  throw new Error('Missing SUPABASE_JWT_SECRET environment variable for backend auth verification.');
}

export type VerifiedSupabaseUser = {
  sub: string;
  email?: string;
  role?: string;
};

export async function verifySupabaseJwt(token: string): Promise<VerifiedSupabaseUser | null> {
  try {
    const payload = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

    return {
      sub: String(payload.sub),
      email: payload.email ? String(payload.email) : undefined,
      role: payload.role ? String(payload.role) : undefined,
    };
  } catch {
    return null;
  }
}
