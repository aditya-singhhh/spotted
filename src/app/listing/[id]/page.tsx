import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicListing, getPublicFeed } from '@/lib/listings';
import { mediaKind } from '@/lib/reward';
import { AREAS } from '@/content/areas';
import { listingInArea } from '@/lib/areaStats';
import ListingDetail from './ListingDetail';

// ISR: cache the rendered listing at the edge and revalidate periodically so
// repeat visits are instant instead of hitting Firestore every time.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = await getPublicListing(params.id).catch(() => null);
  if (!listing) return { title: 'Listing not found — spotted.' };

  const title = `${listing.bhk} BHK near ${listing.landmark ?? 'Bengaluru'} — spotted.`;
  const description = `₹${Number(listing.rent).toLocaleString('en-IN')}/month · ${listing.furnishing ?? 'unfurnished'} · a fresh rental spotted on the street.`;
  const images = mediaKind(listing.media) === 'image' ? [{ url: listing.media as string }] : [];
  return { title, description, openGraph: { title, description, images, type: 'website' }, twitter: { card: 'summary_large_image', title, description } };
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getPublicListing(params.id).catch(() => null);
  if (!listing) notFound();

  // Similar listings + the area guide this listing belongs to (computed on the
  // server so the client gets them instantly). Cheap: reuses the cached feed.
  const feed = await getPublicFeed(200).catch(() => [] as any[]);
  const area = AREAS.find((a) => listingInArea(listing, a)) ?? null;
  const similar = feed
    .filter((l) => l.id !== listing.id)
    .map((l) => ({ l, score: (area && listingInArea(l, area) ? 2 : 0) + (String(l.bhk) === String(listing.bhk) ? 1 : 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.l);

  const areaCard = area ? { slug: area.slug, name: area.name, rating: area.rating.overall, tagline: area.tagline } : null;
  return <ListingDetail id={params.id} initial={listing} similar={similar} area={areaCard} />;
}
