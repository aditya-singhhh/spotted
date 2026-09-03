import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserFromRequest, requireRole } from '@/lib/apiAuth';

const starterHomes = [
  { landmark: 'HSR Layout, Sector 2', lat: 12.9116, lng: 77.6387, bhk: 2, rent: 28000, deposit: 112000, furnishing: 'semi furnished', bachelorAllowed: 'yes', ownerName: 'Anita Rao', ownerPhone: '+91 98450 88121' },
  { landmark: 'Koramangala, 5th Block', lat: 12.9352, lng: 77.6245, bhk: 1, rent: 22000, deposit: 66000, furnishing: 'fully furnished', bachelorAllowed: 'yes', ownerName: 'Naveen Kumar', ownerPhone: '+91 98861 44320' },
  { landmark: 'Whitefield, Hope Farm', lat: 12.9698, lng: 77.7499, bhk: 3, rent: 43000, deposit: 172000, furnishing: 'semi furnished', bachelorAllowed: 'yes', ownerName: 'Meera Iyer', ownerPhone: '+91 98458 22041' }
];

export async function POST(req: NextRequest) {
  const decoded = await getUserFromRequest(req);
  if (!decoded || !(await requireRole(decoded.uid, 'admin'))) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const existing = await adminDb.collection('rentalOpportunities').limit(1).get();
  if (!existing.empty) return NextResponse.json({ error: 'Listings already exist. Seed data is only added to an empty database.' }, { status: 409 });
  const now = new Date().toISOString();
  const batch = adminDb.batch();
  for (const home of starterHomes) {
    const property = adminDb.collection('properties').doc();
    const listing = adminDb.collection('rentalOpportunities').doc();
    batch.set(property, { lat: home.lat, lng: home.lng, landmark: home.landmark, addressExact: home.landmark, createdAt: now });
    batch.set(listing, { propertyId: property.id, scoutId: null, bhk: home.bhk, rent: home.rent, deposit: home.deposit, furnishing: home.furnishing, bachelorAllowed: home.bachelorAllowed, landmark: home.landmark, approxLat: Math.round(home.lat * 1000) / 1000, approxLng: Math.round(home.lng * 1000) / 1000, status: 'verified', trustScore: 90, spottedAt: now, lastVerifiedAt: now, createdAt: now });
    batch.set(listing.collection('private').doc('contact'), { ownerName: home.ownerName, ownerPhone: home.ownerPhone, exactLat: home.lat, exactLng: home.lng, addressExact: home.landmark, notes: 'Seeded starter listing' });
  }
  await batch.commit();
  return NextResponse.json({ success: true, created: starterHomes.length });
}
