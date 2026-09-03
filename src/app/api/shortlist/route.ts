import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest } from '@/lib/apiAuth';
import { getPublicListing } from '@/lib/listings';
import { asString } from '@/lib/validation';
import { captureError } from '@/lib/observability';

const docId = (uid: string, listingId: string) => `${uid}_${listingId}`;

// GET /api/shortlist — the current user's saved listings (public summaries).
export async function GET(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  try {
    const snap = await adminDb.collection('shortlists').where('uid', '==', decoded.uid).limit(100).get();
    const rows = snap.docs.map((d) => d.data()).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
    const listings = (await Promise.all(rows.map((r) => getPublicListing(r.rentalOpportunityId).catch(() => null)))).filter(Boolean);
    return NextResponse.json({ listings, ids: rows.map((r) => r.rentalOpportunityId) });
  } catch (error) {
    captureError('shortlist.list', error, { uid: decoded.uid });
    return NextResponse.json({ listings: [], ids: [] });
  }
}

// POST /api/shortlist  body: { rentalOpportunityId } — save a listing.
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const id = asString((await req.json().catch(() => ({}))).rentalOpportunityId, 200);
  if (!id) return NextResponse.json({ error: 'rentalOpportunityId is required' }, { status: 400 });
  try {
    await adminDb.collection('shortlists').doc(docId(decoded.uid, id)).set({ uid: decoded.uid, rentalOpportunityId: id, createdAt: new Date().toISOString() });
    return NextResponse.json({ saved: true });
  } catch (error) {
    captureError('shortlist.add', error, { uid: decoded.uid, id });
    return NextResponse.json({ error: 'Could not save.' }, { status: 503 });
  }
}

// DELETE /api/shortlist  body: { rentalOpportunityId } — remove a saved listing.
export async function DELETE(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const id = asString((await req.json().catch(() => ({}))).rentalOpportunityId, 200);
  if (!id) return NextResponse.json({ error: 'rentalOpportunityId is required' }, { status: 400 });
  try {
    await adminDb.collection('shortlists').doc(docId(decoded.uid, id)).delete();
    return NextResponse.json({ saved: false });
  } catch (error) {
    captureError('shortlist.remove', error, { uid: decoded.uid, id });
    return NextResponse.json({ error: 'Could not remove.' }, { status: 503 });
  }
}
