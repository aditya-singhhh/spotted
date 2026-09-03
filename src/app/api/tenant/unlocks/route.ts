import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';
import { getPublicListing } from '@/lib/listings';
import { captureError } from '@/lib/observability';

// GET /api/tenant/unlocks — listings this user has unlocked, with owner contact
// and exact location, so they persist in the tenant's profile.
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const snap = await adminDb.collection('unlockTransactions')
      .where('seekerId', '==', decoded.uid)
      .where('paymentStatus', '==', 'success')
      .limit(100).get();

    const seen = new Set<string>();
    const items = await Promise.all(snap.docs.map(async (d) => {
      const id = d.data().rentalOpportunityId as string;
      if (!id || seen.has(id)) return null;
      seen.add(id);
      const listing = await getPublicListing(id).catch(() => null);
      const contactSnap = await adminDb.collection('rentalOpportunities').doc(id).collection('private').doc('contact').get();
      const c = contactSnap.exists ? contactSnap.data()! : {};
      return {
        id,
        listing,
        owner: { name: c.ownerName ?? null, phone: c.ownerPhone ?? null },
        location: { lat: c.exactLat ?? null, lng: c.exactLng ?? null, address: c.addressExact ?? null },
        unlockedAt: d.data().createdAt ?? null
      };
    }));

    return NextResponse.json({ unlocks: items.filter(Boolean) });
  } catch (error) {
    captureError('tenant.unlocks', error, { uid: decoded.uid });
    return NextResponse.json({ unlocks: [] });
  }
}
