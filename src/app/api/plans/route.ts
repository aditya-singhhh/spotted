import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { DEFAULT_PLANS, type Plan } from '@/lib/plans';

// Read live so admin edits to packages/price reflect immediately.
export const dynamic = 'force-dynamic';

// Public: the configurable unlock packages + the single pay-per-unlock price.
// Falls back to shipped defaults if an admin hasn't customised them yet.
export async function GET() {
  try {
    const snap = await adminDb.collection('platformSettings').doc('marketplace').get();
    const data = snap.data() ?? {};
    const raw = Array.isArray(data.plans) && data.plans.length ? (data.plans as Plan[]) : DEFAULT_PLANS;
    return NextResponse.json({
      unlockPrice: Number(data.unlockPrice ?? 29),
      plans: raw.filter((p) => p.active)
    });
  } catch {
    return NextResponse.json({ unlockPrice: 29, plans: DEFAULT_PLANS.filter((p) => p.active) });
  }
}
