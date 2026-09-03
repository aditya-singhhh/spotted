import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './firebaseAdmin';

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>`
 * (the browser client attaches this automatically once a user is signed
 * in — see src/lib/firebaseClient.ts + components/AuthGate.tsx).
 * Returns the decoded token (with .uid, .phone_number, .email), or null.
 */
export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}

/** Looks up (and lazily creates) the app-level profile doc for a user. */
export async function ensureProfile(uid: string, defaults: { phone?: string; email?: string }) {
  const ref = adminDb.collection('users').doc(uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();

  // Bootstrap the first admin from a private env value — but only while no admin
  // exists yet, so it self-disables and can't later hijack the same email.
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  let role = 'seeker';
  if (bootstrapEmail && defaults.email?.trim().toLowerCase() === bootstrapEmail) {
    const existingAdmin = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
    if (existingAdmin.empty) role = 'admin';
  }
  const profile = {
    phone: defaults.phone ?? null,
    email: defaults.email ?? null,
    fullName: null,
    role,
    createdAt: new Date().toISOString()
  };
  await ref.set(profile);
  return profile;
}

export async function requireRole(uid: string, role: 'admin' | 'scout' | 'seeker') {
  const snap = await adminDb.collection('users').doc(uid).get();
  return snap.exists && snap.data()?.role === role;
}
