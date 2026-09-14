import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';
import { asString } from '@/lib/validation';
import { captureError } from '@/lib/observability';

// GET /api/saved-searches — the current user's saved searches.
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  try {
    const snap = await adminDb.collection('savedSearches').where('uid', '==', decoded.uid).limit(50).get();
    const searches = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    return NextResponse.json({ searches });
  } catch (error) {
    captureError('savedSearches.list', error, { uid: decoded.uid });
    return NextResponse.json({ searches: [] });
  }
}

// POST /api/saved-searches  body: { name, query } — query is the /discover query string.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = asString(body?.name, 80) ?? 'Saved search';
  const query = asString(body?.query, 300) ?? '';
  try {
    const hash = crypto.createHash('sha1').update(query).digest('hex').slice(0, 16);
    const id = `${decoded.uid}_${hash}`;
    await adminDb.collection('savedSearches').doc(id).set({ uid: decoded.uid, name, query, createdAt: new Date().toISOString() });
    return NextResponse.json({ saved: true, id });
  } catch (error) {
    captureError('savedSearches.add', error, { uid: decoded.uid });
    return NextResponse.json({ error: 'Could not save the search.' }, { status: 503 });
  }
}

// DELETE /api/saved-searches  body: { id }
export async function DELETE(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const id = asString((await req.json().catch(() => ({}))).id, 200);
  if (!id || !id.startsWith(`${decoded.uid}_`)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await adminDb.collection('savedSearches').doc(id).delete();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    captureError('savedSearches.remove', error, { uid: decoded.uid, id });
    return NextResponse.json({ error: 'Could not remove the search.' }, { status: 503 });
  }
}
