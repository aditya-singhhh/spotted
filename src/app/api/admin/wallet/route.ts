import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';

async function admin(req: NextRequest) { const user = await getUserFromRequest(req); return !!user && requireRole(user.uid, 'admin'); }

export async function GET(req: NextRequest) {
  if (!await admin(req)) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const [settings, rewards] = await Promise.all([
    adminDb.collection('platformSettings').doc('marketplace').get(),
    adminDb.collection('scoutRewards').orderBy('createdAt', 'desc').limit(100).get()
  ]);
  return NextResponse.json({ unlockPrice: Number(settings.data()?.unlockPrice ?? 29), rewards: rewards.docs.map(d => ({ id: d.id, ...d.data() })) });
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
  if (body.action === 'approve_reward') {
    const ref = adminDb.collection('scoutRewards').doc(body.rewardId);
    const reward = await ref.get();
    if (!reward.exists || reward.data()?.status !== 'pending') return NextResponse.json({ error: 'Reward is unavailable or already approved.' }, { status: 400 });
    const data = reward.data()!; const scoutRef = adminDb.collection('scouts').doc(data.scoutId);
    await adminDb.runTransaction(async tx => { const scout = await tx.get(scoutRef); const current = scout.data() ?? {}; tx.update(ref, { status: 'available', approvedAt: new Date().toISOString(), approvedBy: user.uid }); tx.set(scoutRef, { pendingEarnings: Math.max(0, Number(current.pendingEarnings ?? 0) - Number(data.amount)), availableEarnings: Number(current.availableEarnings ?? 0) + Number(data.amount) }, { merge: true }); });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Unknown wallet action.' }, { status: 400 });
}
