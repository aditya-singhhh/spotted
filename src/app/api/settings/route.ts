import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
export async function GET() {
  try { const snap = await adminDb.collection('platformSettings').doc('marketplace').get(); return NextResponse.json({ unlockPrice: Number(snap.data()?.unlockPrice ?? 29) }); }
  catch { return NextResponse.json({ unlockPrice: 29 }); }
}
