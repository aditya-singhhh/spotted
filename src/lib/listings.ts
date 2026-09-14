import { adminDb } from './firebaseAdmin';
import { withTimeout } from './requestTimeout';

export const PUBLIC_STATUSES = ['verified', 'community'];

// Explicit allowlist of fields safe to expose pre-unlock. NEVER spread the raw
// doc — board media / owner contact must stay gated. `mediaUrls` here are the
// public HOME photos only (board proof lives in the private/contact subdoc).
const PUBLIC_FIELDS = ['bhk', 'rent', 'deposit', 'furnishing', 'bachelorAllowed', 'landmark', 'approxLat', 'approxLng', 'media', 'mediaUrls', 'mediaType', 'contactedOwner', 'availabilityConfirmed', 'status', 'trustScore', 'spottedAt', 'lastVerifiedAt', 'createdAt'] as const;

function toPublic(id: string, data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { id };
  for (const k of PUBLIC_FIELDS) if (data[k] !== undefined) out[k] = data[k];
  return out;
}

// A single public-facing listing, or null if it doesn't exist or isn't public.
export async function getPublicListing(id: string) {
  const snap = await withTimeout(adminDb.collection('rentalOpportunities').doc(id).get());
  if (!snap.exists) return null;
  const data = snap.data()!;
  if (!PUBLIC_STATUSES.includes(data.status)) return null;
  return toPublic(snap.id, data);
}

// Newest public listings, capped server-side. Uses the fast status+spottedAt
// composite index when deployed, and falls back to an index-free query with an
// in-memory sort so the feed keeps working before the index exists.
export async function getPublicFeed(limit: number) {
  const col = adminDb.collection('rentalOpportunities');
  try {
    const snap = await withTimeout(col.where('status', 'in', PUBLIC_STATUSES).orderBy('spottedAt', 'desc').limit(limit).get());
    return snap.docs.map((d) => toPublic(d.id, d.data()));
  } catch {
    const snap = await withTimeout(col.where('status', 'in', PUBLIC_STATUSES).limit(limit).get());
    return snap.docs
      .map((d) => toPublic(d.id, d.data()))
      .sort((a, b) => String(b.spottedAt ?? '').localeCompare(String(a.spottedAt ?? '')));
  }
}
