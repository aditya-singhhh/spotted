import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, ensureProfile } from '@/lib/apiAuth';
import { mediaKind } from '@/lib/reward';
import { parseSubmission } from '@/lib/submitLogic';
import { checkRateLimit } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';

// POST /api/scout/submit — Requires Authorization: Bearer <firebase ID token>
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;

  if (!(await checkRateLimit(`submit:${uid}`, { limit: 20, windowMs: 60 * 60 * 1000 }))) {
    return NextResponse.json({ error: 'You are submitting too fast. Please try again later.' }, { status: 429 });
  }

  try {
    const parsed = parseSubmission(await req.json());
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const { lat, lng, bhk, rent, deposit, landmark, ownerName, ownerPhone, notes, furnishing, bachelorAllowed, contactedOwner, availabilityConfirmed, mediaUrls, primaryMedia, mediaType, boardMediaUrls, boardMediaType, quality } = parsed.value;

    const profile = await ensureProfile(uid, { phone: decoded.phone_number, email: decoded.email });

    const scoutRef = adminDb.collection('scouts').doc(uid);
    const scoutSnap = await scoutRef.get();
    if (!scoutSnap.exists) {
      await scoutRef.set({ trustScore: 60, totalEarned: 0, availableEarnings: 0, pendingEarnings: 0, withdrawnEarnings: 0, createdAt: new Date().toISOString() });
      if (profile?.role !== 'admin') {
        await adminDb.collection('users').doc(uid).set({ role: 'scout' }, { merge: true });
      }
    }

    const propertyRef = await adminDb.collection('properties').add({
      createdByScout: uid, lat, lng, landmark, addressExact: landmark, createdAt: new Date().toISOString()
    });

    const round = (n: number) => Math.round(n * 1000) / 1000; // ~110m grid
    const now = new Date().toISOString();

    const roRef = await adminDb.collection('rentalOpportunities').add({
      propertyId: propertyRef.id, scoutId: uid, bhk, rent, deposit,
      furnishing, bachelorAllowed, landmark,
      approxLat: round(lat), approxLng: round(lng),
      media: primaryMedia, mediaUrls, mediaType,
      contactedOwner, availabilityConfirmed,
      status: 'pending', trustScore: quality, spottedAt: now, lastVerifiedAt: null, createdAt: now
    });

    await roRef.collection('private').doc('contact').set({
      ownerName, ownerPhone, exactLat: lat, exactLng: lng, addressExact: landmark, notes,
      boardMediaUrls, boardMediaType
    });

    await Promise.all(
      [...mediaUrls, ...boardMediaUrls].map((url) =>
        adminDb.collection('evidence').add({ rentalOpportunityId: roRef.id, photoUrl: url, mediaType: mediaKind(url), kind: boardMediaUrls.includes(url) ? 'board' : 'home', uploadedBy: uid, createdAt: now })
      )
    );

    return NextResponse.json({ opportunityId: roRef.id }, { status: 201 });
  } catch (error) {
    captureError('scout.submit', error, { uid });
    return NextResponse.json({ error: 'Could not save your discovery. Please try again.' }, { status: 503 });
  }
}
