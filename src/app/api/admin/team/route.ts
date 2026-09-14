import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { captureError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

async function isAdmin(req: NextRequest) { const u = await getUserFromRequest(req); return u && (await requireRole(u.uid, 'admin')) ? u : null; }

// GET → the current admin roster.
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  try {
    const snap = await adminDb.collection('users').where('role', '==', 'admin').limit(50).get();
    return NextResponse.json({ admins: snap.docs.map((d) => ({ id: d.id, email: d.data()?.email ?? null, fullName: d.data()?.fullName ?? null })) });
  } catch (error) {
    captureError('admin.team.list', error, {});
    return NextResponse.json({ admins: [] });
  }
}

// POST → { action:'grant'|'revoke', email }
// `role` is server-only (never client-writable — see firestore.rules), so admin
// credentials are managed exclusively here.
export async function POST(req: NextRequest) {
  const admin = await isAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const action = asString(body.action, 20);
  const email = (asString(body.email, 200) ?? '').toLowerCase();
  if (!email) return NextResponse.json({ error: 'Enter the user’s email.' }, { status: 400 });

  try {
    const snap = await adminDb.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return NextResponse.json({ error: 'No user with that email has signed in yet. Ask them to sign in once, then try again.' }, { status: 404 });
    const doc = snap.docs[0];

    if (action === 'grant') {
      await doc.ref.update({ role: 'admin', updatedAt: new Date().toISOString() });
      return NextResponse.json({ success: true });
    }
    if (action === 'revoke') {
      if (doc.id === admin.uid) return NextResponse.json({ error: 'You can’t revoke your own admin access.' }, { status: 400 });
      const remaining = await adminDb.collection('users').where('role', '==', 'admin').limit(2).get();
      if (remaining.size <= 1) return NextResponse.json({ error: 'At least one admin must remain.' }, { status: 400 });
      await doc.ref.update({ role: 'seeker', updatedAt: new Date().toISOString() });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    captureError('admin.team.post', error, { action });
    return NextResponse.json({ error: 'Action failed. Please try again.' }, { status: 503 });
  }
}
