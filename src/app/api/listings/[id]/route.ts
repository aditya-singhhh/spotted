import { NextRequest, NextResponse } from 'next/server';
import { getPublicListing } from '@/lib/listings';
import { captureError } from '@/lib/observability';

// GET /api/listings/:id — safe pre-unlock detail
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  let listing;
  try {
    listing = await getPublicListing(params.id);
  } catch (error) {
    captureError('listings.detail', error, { id: params.id });
    return NextResponse.json({ error: 'The rental network is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(
    { listing },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
  );
}
