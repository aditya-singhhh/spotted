import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';

// GET /api/scout/stats — Requires Authorization: Bearer <firebase ID token>
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;

  // Run the three independent reads in parallel — sequential awaits were the
  // main source of the dashboard's load latency.
  const [scoutSnap, subsSnap, rewardsSnap] = await Promise.all([
    adminDb.collection('scouts').doc(uid).get(),
    adminDb.collection('rentalOpportunities').where('scoutId', '==', uid).get(),
    adminDb.collection('scoutRewards').where('scoutId', '==', uid).get()
  ]);

  const scout = scoutSnap.exists
    ? scoutSnap.data()
    : { trustScore: 60, totalEarned: 0, availableEarnings: 0, pendingEarnings: 0 };

  const submissions = subsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const verifiedDiscoveries = submissions.filter((s: any) => s.status === 'verified').length;

  return NextResponse.json({
    scout,
    verifiedDiscoveries,
    successfulConnections: rewardsSnap.size,
    submissions
  });
}
