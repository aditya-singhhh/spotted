import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';

// POST /api/admin/verify
// body: { rentalOpportunityId, action: 'verify'|'reject'|'mark_duplicate'|'mark_rented', note }
// Requires Authorization: Bearer <firebase ID token> for a user with role = 'admin'
export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const isAdmin = await requireRole(decoded.uid, 'admin');
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { rentalOpportunityId, action, note } = await req.json();
  if (!rentalOpportunityId || !action) {
    return NextResponse.json({ error: 'rentalOpportunityId and action are required' }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    verify: 'verified',
    reject: 'rejected',
    mark_duplicate: 'rejected',
    mark_rented: 'rented'
  };
  const newStatus = statusMap[action];
  if (!newStatus) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const roRef = adminDb.collection('rentalOpportunities').doc(rentalOpportunityId);
  const update: Record<string, any> = { status: newStatus };
  if (action === 'verify') update.lastVerifiedAt = new Date().toISOString();
  await roRef.update(update);

  await adminDb.collection('verifications').add({
    rentalOpportunityId,
    verifiedBy: decoded.uid,
    action,
    note: note ?? null,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({ success: true, status: newStatus });
}
