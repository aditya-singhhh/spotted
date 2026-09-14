import type { MetadataRoute } from 'next';
import { AREAS } from '@/content/areas';
import { getPublicFeed } from '@/lib/listings';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/discover`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/areas`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/scout`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/trust-and-safety`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 }
  ];

  const areaRoutes: MetadataRoute.Sitemap = AREAS.map((a) => ({
    url: `${SITE_URL}/areas/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.75
  }));

  let listingRoutes: MetadataRoute.Sitemap = [];
  try {
    const feed = await getPublicFeed(1000);
    listingRoutes = feed.map((l) => ({
      url: `${SITE_URL}/listing/${l.id}`,
      lastModified: l.lastVerifiedAt || l.spottedAt ? new Date(l.lastVerifiedAt || l.spottedAt) : now,
      changeFrequency: 'daily' as const,
      priority: 0.7
    }));
  } catch {
    /* feed unavailable at build — static + area routes still ship */
  }

  return [...staticRoutes, ...areaRoutes, ...listingRoutes];
}
