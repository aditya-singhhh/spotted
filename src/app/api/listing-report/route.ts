import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { captureError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

const REASONS = ['rented', 'unreachable', 'wrong_info', 'other'] as const;
const AUTO_RENTED_THRESHOLD = 3; // distinct "already rented" reports → auto-mark rented

// POST /api/listing-report  { rentalOpportunityId, reason, note? }
// A renter who unlocked a listing can flag it (e.g. already rented). This is
// recorded for review — NOT an instant refund. Enough independent "rented"
// reports auto-marks the listing so it drops out of the feed.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;

  const body = await req.json().catch(() => ({}));
  const rentalOpportunityId = asString(body.rentalOpportunityId, 200);
  const reason = asString(body.reason, 20);
  const note = asString(body.note, 300);
  if (!rentalOpportunityId) return NextResponse.json({ error: 'rentalOpportunityId is required' }, { status: 400 });
  if (!reason || !REASONS.includes(reason as any)) return NextResponse.json({ error: 'Pick a valid reason.' }, { status: 400 });

  try {
    // Only renters who actually unlocked this listing may report it (the unlock
    // txn uses a deterministic id — see /api/unlock).
    const unlockRef = adminDb.collection('unlockTransactions').doc(`${uid}_${rentalOpportunityId}`);
    if (!(await unlockRef.get()).exists) {
      return NextResponse.json({ error: 'You can report a listing only after unlocking it.' }, { status: 403 });
    }

    const reportRef = adminDb.collection('reports').doc(`${uid}_${rentalOpportunityId}`);
    const roRef = adminDb.collection('rentalOpportunities').doc(rentalOpportunityId);
    const now = new Date().toISOString();

    await adminDb.runTransaction(async (tx) => {
      const [existing, ro] = await Promise.all([tx.get(reportRef), tx.get(roRef)]);
      const wasRented = existing.exists && existing.data()?.reason === 'rented';
      tx.set(reportRef, { rentalOpportunityId, uid, reason, note: note || null, status: 'open', createdAt: existing.exists ? existing.data()?.createdAt ?? now : now, updatedAt: now }, { merge: true });

      if (!ro.exists) return;
      const data = ro.data()!;
      const patch: Record<string, any> = {};
      // Count this report once (first time this user reports this listing).
      if (!existing.exists) patch.reportCount = Number(data.reportCount ?? 0) + 1;
      // Track distinct "rented" reports; only add when this user newly says rented.
      let rentedReports = Number(data.rentedReports ?? 0);
      if (reason === 'rented' && !wasRented) { rentedReports += 1; patch.rentedReports = rentedReports; }
      // Enough independent confirmations → drop it from the live feed.
      if (rentedReports >= AUTO_RENTED_THRESHOLD && data.status !== 'rented') {
        patch.status = 'rented';
        patch.autoRentedAt = now;
      }
      if (Object.keys(patch).length) tx.update(roRef, patch);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError('listingReport', error, { uid, rentalOpportunityId, reason });
    return NextResponse.json({ error: 'Could not submit your report. Please try again.' }, { status: 503 });
  }
}
