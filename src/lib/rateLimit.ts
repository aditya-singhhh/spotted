import { adminDb } from './firebaseAdmin';

export type RateLimitOptions = { limit: number; windowMs: number };

// Fixed-window rate limiter backed by a `rateLimits/{key}` doc. Returns true if
// the action is allowed. Fails open (allows) if the store is unreachable so a
// transient DB blip never locks out legitimate users.
export async function checkRateLimit(key: string, opts: RateLimitOptions): Promise<boolean> {
  const ref = adminDb.collection('rateLimits').doc(key);
  const now = Date.now();
  try {
    return await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data()! : null;
      if (!data || now - Number(data.windowStart ?? 0) > opts.windowMs) {
        tx.set(ref, { windowStart: now, count: 1 });
        return true;
      }
      if (Number(data.count ?? 0) >= opts.limit) return false;
      tx.update(ref, { count: Number(data.count ?? 0) + 1 });
      return true;
    });
  } catch {
    return true;
  }
}
