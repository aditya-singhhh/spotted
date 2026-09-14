import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, ensureProfile } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { captureError } from '@/lib/observability';
import { parseScoutRequest } from '@/lib/scoutRequests';

export const dynamic = 'force-dynamic';

// GET /api/scout-requests?view=mine|assigned
//   mine     → requests this renter created
//   assigned → requests assigned to this scout
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const view = new URL(req.url).searchParams.get('view') === 'assigned' ? 'assigned' : 'mine';
  const field = view === 'assigned' ? 'assignedScoutId' : 'seekerId';
  try {
    // No orderBy → no composite index needed; sort in memory.
    const snap = await adminDb.collection('scoutRequests').where(field, '==', decoded.uid).limit(100).get();
    const requests = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    return NextResponse.json({ requests });
  } catch (error) {
    captureError('scoutRequests.list', error, { uid: decoded.uid, view });
    return NextResponse.json({ requests: [] });
  }
}

// POST /api/scout-requests
//   { action: 'create', area, bhk, budgetMax, moveIn, notes }
//   { action: 'fulfill', id, matchedListingIds[] }  (assigned scout only)
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const uid = decoded.uid;
  const body = await req.json().catch(() => ({}));
  const action = asString(body.action, 20) || 'create';

  try {
    if (action === 'create') {
      if (!(await checkRateLimit(`screq:${uid}`, { limit: 10, windowMs: 24 * 60 * 60 * 1000 }))) {
        return NextResponse.json({ error: 'You have a lot of open requests already. Please try again later.' }, { status: 429 });
      }
      const parsed = parseScoutRequest(body);
      if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
      await ensureProfile(uid, { phone: decoded.phone_number, email: decoded.email });
      const now = new Date().toISOString();
      const ref = await adminDb.collection('scoutRequests').add({
        ...parsed.value,
        seekerId: uid,
        seekerEmail: decoded.email ?? null,
        seekerPhone: decoded.phone_number ?? null,
        status: 'open',
        assignedScoutId: null,
        assignedScoutName: null,
        matchedListingIds: [],
        createdAt: now,
        updatedAt: now
      });
      return NextResponse.json({ success: true, id: ref.id });
    }

    if (action === 'fulfill') {
      const id = asString(body.id, 200);
      const ids = Array.isArray(body.matchedListingIds) ? body.matchedListingIds.map((x: any) => asString(x, 200)).filter(Boolean).slice(0, 20) : [];
      if (!id) return NextResponse.json({ error: 'Request id is required' }, { status: 400 });
      const ref = adminDb.collection('scoutRequests').doc(id);
      const ok = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists || snap.data()?.assignedScoutId !== uid) return false;
        tx.update(ref, { status: 'fulfilled', matchedListingIds: ids, fulfilledAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        return true;
      });
      if (!ok) return NextResponse.json({ error: 'This request is not assigned to you.' }, { status: 403 });
      // Notify the seeker in-app.
      const snap = await ref.get();
      const seekerId = snap.data()?.seekerId;
      if (seekerId) {
        await adminDb.collection('notifications').add({
          uid: seekerId, type: 'request_fulfilled',
          title: 'Your scout shared listings',
          body: `A scout has shared ${ids.length} listing${ids.length === 1 ? '' : 's'} for ${snap.data()?.area}.`,
          link: '/request', read: false, createdAt: new Date().toISOString()
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    captureError('scoutRequests.post', error, { uid, action });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 503 });
  }
}
