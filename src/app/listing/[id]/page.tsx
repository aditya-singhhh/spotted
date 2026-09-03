import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicListing } from '@/lib/listings';
import { mediaKind } from '@/lib/reward';
import ListingDetail from './ListingDetail';

export const dynamic = 'force-dynamic';

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
  return <ListingDetail id={params.id} initial={listing} />;
}
