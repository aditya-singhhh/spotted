import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';

// GET /api/admin/listings — full queue (all statuses) for the ops dashboard
// Requires Authorization: Bearer <firebase ID token> for a user with role = 'admin'
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const isAdmin = await requireRole(decoded.uid, 'admin');
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const snap = await adminDb.collection('rentalOpportunities').orderBy('createdAt', 'desc').limit(200).get();
  const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

  // Resolve scout names + unlock counts. Fan the per-listing reads out in
  // parallel so the queue loads in one round-trip instead of N sequential ones.
  await Promise.all(listings.map(async (l) => {
    const [userSnap, unlocksSnap] = await Promise.all([
      l.scoutId ? adminDb.collection('users').doc(l.scoutId).get() : Promise.resolve(null),
      adminDb.collection('unlockTransactions').where('rentalOpportunityId', '==', l.id).get()
    ]);
    if (l.scoutId) {
      l.scoutName = userSnap?.exists ? userSnap.data()?.fullName ?? userSnap.data()?.phone ?? l.scoutId : l.scoutId;
    }
    l.unlocks = unlocksSnap.size;
  }));

  const [totalSnap, verifiedSnap, pendingSnap, reportedSnap] = await Promise.all([
    adminDb.collection('rentalOpportunities').count().get(),
    adminDb.collection('rentalOpportunities').where('status', '==', 'verified').count().get(),
    adminDb.collection('rentalOpportunities').where('status', '==', 'pending').count().get(),
    adminDb.collection('reports').count().get()
  ]);

  return NextResponse.json({
    listings,
    metrics: {
      total: totalSnap.data().count,
      verified: verifiedSnap.data().count,
      pending: pendingSnap.data().count,
      reported: reportedSnap.data().count
    }
  });
}
