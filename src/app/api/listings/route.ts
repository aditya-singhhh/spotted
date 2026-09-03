import { NextRequest, NextResponse } from 'next/server';
import { haversineKm } from '@/lib/geo';
import { getPublicFeed } from '@/lib/listings';
import { asFiniteNumber } from '@/lib/validation';
import { captureError } from '@/lib/observability';

// GET /api/listings?lat=..&lng=..&bhk=2&bachelor=yes&limit=24 — public fields
// of verified/community listings only; owner contact stays server-only.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = asFiniteNumber(searchParams.get('lat'));
    const lng = asFiniteNumber(searchParams.get('lng'));
    const bhk = searchParams.get('bhk');
    const bachelor = searchParams.get('bachelor');
    const limit = Math.min(100, Math.max(1, asFiniteNumber(searchParams.get('limit')) ?? 48));

    let results = await getPublicFeed(limit);

    if (bhk) results = results.filter((r) => r.bhk === Number(bhk));
    if (bachelor) results = results.filter((r) => r.bachelorAllowed === bachelor);

    if (lat !== null && lng !== null) {
      const me = { lat, lng };
      results = results
        .map((r) => ({ ...r, kmAway: haversineKm(me, { lat: r.approxLat, lng: r.approxLng }) }))
        .sort((a, b) => a.kmAway - b.kmAway);
    }

    return NextResponse.json(
      { listings: results },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
    );
  } catch (error) {
    captureError('listings.feed', error);
    return NextResponse.json({ error: 'The rental network is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
}
