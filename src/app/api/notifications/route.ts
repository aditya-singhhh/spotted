import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { captureError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

// GET /api/notifications — the caller's recent in-app notifications (newest first).
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  try {
    const snap = await adminDb.collection('notifications').where('uid', '==', decoded.uid).limit(50).get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    return NextResponse.json({ notifications: items, unread: items.filter((n: any) => !n.read).length });
  } catch (error) {
    captureError('notifications.list', error, { uid: decoded.uid });
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

// POST /api/notifications  { action: 'read', id }  |  { action: 'read_all' }
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = asString(body.action, 20);
  try {
    if (action === 'read') {
      const id = asString(body.id, 200);
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const ref = adminDb.collection('notifications').doc(id);
      const snap = await ref.get();
      if (snap.exists && snap.data()?.uid === decoded.uid) await ref.update({ read: true });
      return NextResponse.json({ success: true });
    }
    if (action === 'read_all') {
      const snap = await adminDb.collection('notifications').where('uid', '==', decoded.uid).where('read', '==', false).limit(200).get();
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    captureError('notifications.post', error, { uid: decoded.uid });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 503 });
  }
}
