import { adminDb } from './firebaseAdmin';
import { withTimeout } from './requestTimeout';

export const PUBLIC_STATUSES = ['verified', 'community'];

// A single public-facing listing, or null if it doesn't exist or isn't public.
export async function getPublicListing(id: string) {
  const snap = await withTimeout(adminDb.collection('rentalOpportunities').doc(id).get());
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (!PUBLIC_STATUSES.includes(data.status)) return null;
  return { id: snap.id, ...data } as Record<string, any>;
}

// Newest public listings, capped server-side. Uses the fast status+spottedAt
// composite index when deployed, and falls back to an index-free query with an
// in-memory sort so the feed keeps working before the index exists.
export async function getPublicFeed(limit: number) {
  const col = adminDb.collection('rentalOpportunities');
  try {
    const snap = await withTimeout(col.where('status', 'in', PUBLIC_STATUSES).orderBy('spottedAt', 'desc').limit(limit).get());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Record<string, any>[];
  } catch {
    const snap = await withTimeout(col.where('status', 'in', PUBLIC_STATUSES).limit(limit).get());
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Record<string, any>)
      .sort((a, b) => String(b.spottedAt ?? '').localeCompare(String(a.spottedAt ?? '')));
  }
}
