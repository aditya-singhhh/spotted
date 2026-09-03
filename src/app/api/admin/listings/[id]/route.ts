import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';
import { asString, asFiniteNumber, inRange } from '@/lib/validation';
import { captureError } from '@/lib/observability';

async function requireAdmin(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return { error: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) };
  if (!(await requireRole(decoded.uid, 'admin'))) return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  return { uid: decoded.uid };
}

// PATCH /api/admin/listings/:id — edit a listing's public + contact fields.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const ref = adminDb.collection('rentalOpportunities').doc(params.id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const update: Record<string, unknown> = {};
    const bhk = asFiniteNumber(body.bhk);
    const rent = asFiniteNumber(body.rent);
    const deposit = asFiniteNumber(body.deposit);
    if (inRange(bhk, 1, 20)) update.bhk = bhk;
    if (inRange(rent, 1, 100_000_000)) update.rent = rent;
    if (inRange(deposit, 0, 1_000_000_000)) update.deposit = deposit;
    if (asString(body.landmark, 120) !== null) update.landmark = asString(body.landmark, 120);
    if (asString(body.furnishing, 40) !== null) update.furnishing = asString(body.furnishing, 40);
    if (['yes', 'no', 'unknown'].includes(body.bachelorAllowed)) update.bachelorAllowed = body.bachelorAllowed;
    if (['pending', 'verified', 'community', 'rejected', 'rented'].includes(body.status)) update.status = body.status;

    if (Object.keys(update).length) await ref.update(update);

    const contact: Record<string, unknown> = {};
    if (asString(body.ownerName, 120) !== null) contact.ownerName = asString(body.ownerName, 120);
    if (asString(body.ownerPhone, 32) !== null) contact.ownerPhone = asString(body.ownerPhone, 32);
    if (asString(body.notes, 1000) !== null) contact.notes = asString(body.notes, 1000);
    if (Object.keys(contact).length) await ref.collection('private').doc('contact').set(contact, { merge: true });

    return NextResponse.json({ success: true, updated: Object.keys(update) });
  } catch (error) {
    captureError('admin.listing.edit', error, { id: params.id });
    return NextResponse.json({ error: 'Could not update the listing.' }, { status: 503 });
  }
}

// DELETE /api/admin/listings/:id — remove the listing, its property, private
// contact and evidence. Unlock transactions are kept for audit.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const ref = adminDb.collection('rentalOpportunities').doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const propertyId = snap.data()?.propertyId as string | undefined;
    const [privateDocs, evidence] = await Promise.all([
      ref.collection('private').listDocuments(),
      adminDb.collection('evidence').where('rentalOpportunityId', '==', params.id).get()
    ]);

    const batch = adminDb.batch();
    privateDocs.forEach((d) => batch.delete(d));
    evidence.docs.forEach((d) => batch.delete(d.ref));
    if (propertyId) batch.delete(adminDb.collection('properties').doc(propertyId));
    batch.delete(ref);
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    captureError('admin.listing.delete', error, { id: params.id });
    return NextResponse.json({ error: 'Could not delete the listing.' }, { status: 503 });
  }
}
