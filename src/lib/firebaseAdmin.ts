import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// SERVER-ONLY. Import this exclusively inside app/api/**/route.ts files.
// Never import this from a 'use client' component — the service account
// key must never reach the browser.
//
// FIREBASE_SERVICE_ACCOUNT_KEY should contain the full JSON contents of a
// service account key file, as a single-line string (see README for how
// to generate one and set it in Vercel).
function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  // On a developer machine, a downloaded service account can safely live in
  // scripts/serviceAccountKey.json (already gitignored). Production should
  // always use the environment variable set by the hosting provider.
  const localKeyPath = join(process.cwd(), 'scripts', 'serviceAccountKey.json');
  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = existsSync(localKeyPath)
      ? JSON.parse(readFileSync(localKeyPath, 'utf8'))
      : raw
        ? JSON.parse(raw)
        : (() => { throw new Error('missing'); })();
  } catch {
    throw new Error(
      'Firebase Admin is not configured. Add valid one-line JSON to FIREBASE_SERVICE_ACCOUNT_KEY, or save the downloaded key as scripts/serviceAccountKey.json.'
    );
  }

  return initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0])
  });
}

const adminApp = getAdminApp();

// Default gRPC transport: the REST transport (preferRest) failed here with
// ERR_STREAM_PREMATURE_CLOSE and burned ~40s retrying before 503-ing, while gRPC
// returns results reliably. getFirestore is also safe across dev hot reloads.
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
