import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';
import { asString, asFiniteNumber } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';

const MIN_WITHDRAWAL = 100;

// POST /api/scout/withdraw  body: { amount, method: { type:'upi'|'bank', value } }
// Moves `amount` out of availableEarnings immediately and creates a `requested`
// withdrawal (admin later marks it paid, or rejects → refund). Idempotency comes
// from the balance decrement inside the transaction.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;

  if (!(await checkRateLimit(`withdraw:${uid}`, { limit: 10, windowMs: 60 * 60 * 1000 }))) {
    return NextResponse.json({ error: 'Too many withdrawal requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = asFiniteNumber(body?.amount);
  const methodType = body?.method?.type === 'bank' ? 'bank' : 'upi';
  const methodValue = asString(body?.method?.value, 140);
  if (!methodValue) return NextResponse.json({ error: 'Enter your UPI ID or bank account details.' }, { status: 400 });
  if (amount === null || amount < MIN_WITHDRAWAL) return NextResponse.json({ error: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}.` }, { status: 400 });

  try {
    const scoutRef = adminDb.collection('scouts').doc(uid);
    const wRef = adminDb.collection('withdrawals').doc();
    const now = new Date().toISOString();

    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(scoutRef);
      const available = Number(snap.data()?.availableEarnings ?? 0);
      if (amount > available) return { error: 'Amount exceeds your available balance.' as string };
      tx.update(scoutRef, { availableEarnings: available - amount });
      tx.set(wRef, { scoutId: uid, amount, method: { type: methodType, value: methodValue }, status: 'requested', createdAt: now });
      return { ok: true as const };
    });

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, id: wRef.id });
  } catch (error) {
    captureError('scout.withdraw', error, { uid });
    return NextResponse.json({ error: 'Could not submit your withdrawal. Please try again.' }, { status: 503 });
  }
}
