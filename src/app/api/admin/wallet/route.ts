import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';
import { DEFAULT_PLANS, validatePlans, type Plan } from '@/lib/plans';

async function admin(req: NextRequest) { const user = await getUserFromRequest(req); return !!user && requireRole(user.uid, 'admin'); }

export async function GET(req: NextRequest) {
  if (!await admin(req)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const [settings, rewards, withdrawals, purchases] = await Promise.all([
    adminDb.collection('platformSettings').doc('marketplace').get(),
    adminDb.collection('scoutRewards').orderBy('createdAt', 'desc').limit(100).get(),
    adminDb.collection('withdrawals').orderBy('createdAt', 'desc').limit(100).get(),
    adminDb.collection('packagePurchases').orderBy('createdAt', 'desc').limit(200).get()
  ]);
  const configured = settings.data()?.plans as Plan[] | undefined;
  return NextResponse.json({
    unlockPrice: Number(settings.data()?.unlockPrice ?? 29),
    plans: Array.isArray(configured) && configured.length ? configured : DEFAULT_PLANS,
    rewards: rewards.docs.map((d) => ({ id: d.id, ...d.data() })),
    withdrawals: withdrawals.docs.map((d) => ({ id: d.id, ...d.data() })),
    purchases: purchases.docs.map((d) => ({ id: d.id, ...d.data() }))
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !await requireRole(user.uid, 'admin')) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const body = await req.json();
  if (body.action === 'set_price') {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 1 || amount > 9999) return NextResponse.json({ error: 'Enter a whole rupee amount between 1 and 9,999.' }, { status: 400 });
    await adminDb.collection('platformSettings').doc('marketplace').set({ unlockPrice: amount, updatedAt: new Date().toISOString(), updatedBy: user.uid }, { merge: true });
    return NextResponse.json({ success: true });
  }
  if (body.action === 'set_plans') {
    const result = validatePlans(body.plans);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    await adminDb.collection('platformSettings').doc('marketplace').set({ plans: result.plans, updatedAt: new Date().toISOString(), updatedBy: user.uid }, { merge: true });
    return NextResponse.json({ success: true, plans: result.plans });
  }
  if (body.action === 'approve_reward') {
    const ref = adminDb.collection('scoutRewards').doc(body.rewardId);
    // Re-check the pending status inside the transaction so two concurrent
    // approvals can't both credit the scout.
    const ok = await adminDb.runTransaction(async (tx) => {
      const reward = await tx.get(ref);
      if (!reward.exists || reward.data()?.status !== 'pending') return false;
      const data = reward.data()!;
      const scoutRef = adminDb.collection('scouts').doc(data.scoutId);
      const scout = await tx.get(scoutRef);
      const current = scout.data() ?? {};
      tx.update(ref, { status: 'available', approvedAt: new Date().toISOString(), approvedBy: user.uid });
      tx.set(scoutRef, {
        pendingEarnings: Math.max(0, Number(current.pendingEarnings ?? 0) - Number(data.amount)),
        availableEarnings: Number(current.availableEarnings ?? 0) + Number(data.amount),
        totalEarned: Number(current.totalEarned ?? 0) + Number(data.amount)
      }, { merge: true });
      return true;
    });
    if (!ok) return NextResponse.json({ error: 'Reward is unavailable or already approved.' }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (body.action === 'mark_paid' || body.action === 'reject_withdrawal') {
    const wRef = adminDb.collection('withdrawals').doc(body.withdrawalId);
    const ok = await adminDb.runTransaction(async (tx) => {
      const w = await tx.get(wRef);
      if (!w.exists || w.data()?.status !== 'requested') return false;
      const d = w.data()!;
      if (body.action === 'mark_paid') {
        const scoutRef = adminDb.collection('scouts').doc(d.scoutId);
        const scout = await tx.get(scoutRef);
        const cur = scout.data() ?? {};
        tx.update(wRef, { status: 'paid', paidAt: new Date().toISOString(), paidBy: user.uid });
        tx.set(scoutRef, { withdrawnEarnings: Number(cur.withdrawnEarnings ?? 0) + Number(d.amount) }, { merge: true });
      } else {
        const scoutRef = adminDb.collection('scouts').doc(d.scoutId);
        const scout = await tx.get(scoutRef);
        const cur = scout.data() ?? {};
        tx.update(wRef, { status: 'rejected', rejectedAt: new Date().toISOString(), rejectedBy: user.uid });
        tx.set(scoutRef, { availableEarnings: Number(cur.availableEarnings ?? 0) + Number(d.amount) }, { merge: true });
      }
      return true;
    });
    if (!ok) return NextResponse.json({ error: 'Withdrawal unavailable or already processed.' }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Unknown wallet action.' }, { status: 400 });
}
