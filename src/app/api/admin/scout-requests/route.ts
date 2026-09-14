import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { captureError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

async function isAdmin(req: NextRequest) { const u = await getUserFromRequest(req); return u && (await requireRole(u.uid, 'admin')) ? u : null; }

// GET → all scout requests (open first) + a roster of scouts to assign from.
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const [reqSnap, scoutSnap] = await Promise.all([
      adminDb.collection('scoutRequests').limit(200).get(),
      adminDb.collection('scouts').limit(100).get()
    ]);
    const order: Record<string, number> = { open: 0, assigned: 1, fulfilled: 2, closed: 3 };
    const requests = reqSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));

    // Join scout names from users for a friendly assignment dropdown.
    const scouts = await Promise.all(scoutSnap.docs.map(async (d) => {
      const u = await adminDb.collection('users').doc(d.id).get();
      return { id: d.id, name: u.data()?.fullName || u.data()?.email || `Scout ${d.id.slice(0, 6)}`, trustScore: d.data()?.trustScore ?? null };
    }));
    return NextResponse.json({ requests, scouts });
  } catch (error) {
    captureError('admin.scoutRequests.list', error, {});
    return NextResponse.json({ requests: [], scouts: [] });
  }
}

// POST → { action:'assign', id, scoutId } | { action:'close', id }
export async function POST(req: NextRequest) {
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const action = asString(body.action, 20);
  const id = asString(body.id, 200);
  if (!id) return NextResponse.json({ error: 'Request id is required' }, { status: 400 });

  try {
    const ref = adminDb.collection('scoutRequests').doc(id);
    if (action === 'assign') {
      const scoutId = asString(body.scoutId, 200);
      if (!scoutId) return NextResponse.json({ error: 'Pick a scout to assign.' }, { status: 400 });
      const [scoutDoc, userDoc, reqDoc] = await Promise.all([
        adminDb.collection('scouts').doc(scoutId).get(),
        adminDb.collection('users').doc(scoutId).get(),
        ref.get()
      ]);
      if (!reqDoc.exists) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
      const scoutName = userDoc.data()?.fullName || userDoc.data()?.email || `Scout ${scoutId.slice(0, 6)}`;
      // Ensure the assignee has a scouts record so they get an "assigned" view.
      if (!scoutDoc.exists) await adminDb.collection('scouts').doc(scoutId).set({ createdAt: new Date().toISOString(), trustScore: 0, pendingEarnings: 0, availableEarnings: 0, totalEarned: 0, withdrawnEarnings: 0 }, { merge: true });
      await ref.update({ status: 'assigned', assignedScoutId: scoutId, assignedScoutName: scoutName, assignedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      // Notify the assigned scout in-app — this is how the rider "gets to know".
      await adminDb.collection('notifications').add({
        uid: scoutId, type: 'request_assigned',
        title: 'New area to scout',
        body: `You've been assigned to scout ${reqDoc.data()?.area}${reqDoc.data()?.bhk && reqDoc.data()?.bhk !== 'any' ? ` (${reqDoc.data()?.bhk} BHK)` : ''}. Open it to see details.`,
        link: '/scout/dashboard', read: false, createdAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true, assignedScoutName: scoutName });
    }
    if (action === 'close') {
      await ref.update({ status: 'closed', updatedAt: new Date().toISOString() });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    captureError('admin.scoutRequests.post', error, { action, id });
    return NextResponse.json({ error: 'Action failed. Please try again.' }, { status: 503 });
  }
}
