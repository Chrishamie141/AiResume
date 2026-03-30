export type VerifiedFirebaseUser = {
  uid: string;
  email?: string;
  displayName?: string;
};

const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser | null> {
  if (!firebaseWebApiKey) {
    return null;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseWebApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    users?: Array<{ localId: string; email?: string; displayName?: string }>;
  };

  const user = payload.users?.[0];
  if (!user) {
    return null;
  }

  return {
    uid: user.localId,
    email: user.email,
    displayName: user.displayName,
  };
}

export const hasFirebaseTokenVerifier = Boolean(firebaseWebApiKey);
