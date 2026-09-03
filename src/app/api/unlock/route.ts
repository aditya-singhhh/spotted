import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, ensureProfile } from '@/lib/apiAuth';
import { scoutReward } from '@/lib/reward';
import { asString } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';

const SCOUT_SHARE = 0.5; // base scout share of each unlock, before quality scaling

// POST /api/unlock  body: { rentalOpportunityId }
// Requires Authorization: Bearer <firebase ID token>
//
// This mocks the payment gateway: it marks the transaction as
// 'success' immediately. Swap the marked block below for a real
// Razorpay/Stripe verification once you have live credentials —
// keep everything else (reward split, detail reveal) unchanged.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;

  if (!(await checkRateLimit(`unlock:${uid}`, { limit: 30, windowMs: 60 * 60 * 1000 }))) {
    return NextResponse.json({ error: 'Too many unlock attempts. Please try again later.' }, { status: 429 });
  }

  const rentalOpportunityId = asString((await req.json().catch(() => ({}))).rentalOpportunityId, 200);
  if (!rentalOpportunityId) {
    return NextResponse.json({ error: 'rentalOpportunityId is required' }, { status: 400 });
  }

  try {
    await ensureProfile(uid, { phone: decoded.phone_number, email: decoded.email });

  const roRef = adminDb.collection('rentalOpportunities').doc(rentalOpportunityId);
  const roSnap = await roRef.get();
  if (!roSnap.exists) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  const opportunity = roSnap.data()!;
  const settingsSnap = await adminDb.collection('platformSettings').doc('marketplace').get();
  const unlockPrice = Number(settingsSnap.data()?.unlockPrice ?? 29);

  const alreadyUnlocked = await adminDb.collection('unlockTransactions')
    .where('rentalOpportunityId', '==', rentalOpportunityId)
    .where('seekerId', '==', uid)
    .where('paymentStatus', '==', 'success')
    .limit(1).get();

  // ---- MOCK PAYMENT (replace with real gateway verification) ----
  const paymentStatus: 'success' | 'failed' = 'success';
  // -----------------------------------------------------------------

  const now = new Date().toISOString();
  const txnRef = alreadyUnlocked.empty
    ? await adminDb.collection('unlockTransactions').add({ rentalOpportunityId, seekerId: uid, amount: unlockPrice, paymentStatus, paymentRef: `mock_${Date.now()}`, createdAt: now })
    : alreadyUnlocked.docs[0].ref;

  if (paymentStatus !== 'success') {
    return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
  }

  const contactSnap = await roRef.collection('private').doc('contact').get();
  const contact = contactSnap.exists ? contactSnap.data()! : {};

  // Credit the scout — payout scales with the listing's quality score.
  if (opportunity.scoutId && alreadyUnlocked.empty) {
    const reward = scoutReward(unlockPrice, Number(opportunity.trustScore ?? 0), SCOUT_SHARE);
    await adminDb.collection('scoutRewards').add({
      scoutId: opportunity.scoutId,
      unlockTransactionId: txnRef.id,
      amount: reward,
      status: 'pending',
      createdAt: now
    });

    const scoutRef = adminDb.collection('scouts').doc(opportunity.scoutId);
    const scoutSnap = await scoutRef.get();
    if (scoutSnap.exists) {
      const scout = scoutSnap.data()!;
      await scoutRef.update({
        pendingEarnings: (scout.pendingEarnings ?? 0) + reward,
        totalEarned: (scout.totalEarned ?? 0) + reward
      });
    }
  }

    return NextResponse.json({
      unlocked: true,
      owner: {
        name: contact.ownerName ?? null,
        phone: contact.ownerPhone ?? null
      },
      location: {
        lat: contact.exactLat,
        lng: contact.exactLng,
        address: contact.addressExact
      }
    });
  } catch (error) {
    captureError('unlock', error, { uid, rentalOpportunityId });
    return NextResponse.json({ error: 'Could not complete the unlock. Please try again.' }, { status: 503 });
  }
}

// GET /api/unlock?rentalOpportunityId=..  — restores a previous unlock (kept in
// unlockTransactions) so a paid unlock persists across refreshes without recharge.
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const id = asString(new URL(req.url).searchParams.get('rentalOpportunityId'), 200);
  if (!id) return NextResponse.json({ unlocked: false });

  try {
    const existing = await adminDb.collection('unlockTransactions')
      .where('rentalOpportunityId', '==', id)
      .where('seekerId', '==', decoded.uid)
      .where('paymentStatus', '==', 'success')
      .limit(1).get();
    if (existing.empty) return NextResponse.json({ unlocked: false });

    const contactSnap = await adminDb.collection('rentalOpportunities').doc(id).collection('private').doc('contact').get();
    const contact = contactSnap.exists ? contactSnap.data()! : {};
    return NextResponse.json({
      unlocked: true,
      owner: { name: contact.ownerName ?? null, phone: contact.ownerPhone ?? null },
      location: { lat: contact.exactLat, lng: contact.exactLng, address: contact.addressExact }
    });
  } catch (error) {
    captureError('unlock.status', error, { uid: decoded.uid, id });
    return NextResponse.json({ unlocked: false });
  }
}
