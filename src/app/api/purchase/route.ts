import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, ensureProfile } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';
import { DEFAULT_PLANS, getPlan, applyPlan, normalizeEntitlement, type Plan } from '@/lib/plans';

// GET /api/purchase — the caller's current entitlement (credits + pass expiry).
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  try {
    const snap = await adminDb.collection('entitlements').doc(decoded.uid).get();
    return NextResponse.json(normalizeEntitlement(snap.data()));
  } catch (error) {
    captureError('purchase.status', error, { uid: decoded.uid });
    return NextResponse.json({ credits: 0, passExpiresAt: null });
  }
}

// POST /api/purchase  body: { planId }
// Mocks the payment gateway (marks success immediately), then grants the plan's
// credits / pass to the user's entitlement in a transaction. Swap the marked
// block for real Razorpay/Stripe verification when live — keep the rest.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;

  if (!(await checkRateLimit(`purchase:${uid}`, { limit: 20, windowMs: 60 * 60 * 1000 }))) {
    return NextResponse.json({ error: 'Too many purchase attempts. Please try again later.' }, { status: 429 });
  }

  const planId = asString((await req.json().catch(() => ({}))).planId, 60);
  if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 });

  try {
    const settingsSnap = await adminDb.collection('platformSettings').doc('marketplace').get();
    const configured = settingsSnap.data()?.plans as Plan[] | undefined;
    const plans = Array.isArray(configured) && configured.length ? configured : DEFAULT_PLANS;
    const plan = getPlan(plans, planId);
    if (!plan) return NextResponse.json({ error: 'That package is no longer available.' }, { status: 404 });

    await ensureProfile(uid, { phone: decoded.phone_number, email: decoded.email });

    // ---- MOCK PAYMENT (replace with real gateway verification) ----
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const entRef = adminDb.collection('entitlements').doc(uid);
    // -----------------------------------------------------------------

    const entitlement = await adminDb.runTransaction(async (tx) => {
      const cur = normalizeEntitlement((await tx.get(entRef)).data());
      const next = applyPlan(cur, plan, now);
      tx.set(entRef, { ...next, updatedAt: nowIso }, { merge: true });
      tx.set(adminDb.collection('packagePurchases').doc(), {
        uid, planId: plan.id, planLabel: plan.label, planType: plan.type,
        amount: plan.price, credits: plan.credits ?? null, days: plan.days ?? null,
        paymentStatus: 'success', paymentRef: `mock_${now}`, createdAt: nowIso
      });
      return next;
    });

    return NextResponse.json({ success: true, entitlement });
  } catch (error) {
    captureError('purchase', error, { uid, planId });
    return NextResponse.json({ error: 'Could not complete the purchase. Please try again.' }, { status: 503 });
  }
}
