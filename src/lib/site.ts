// Canonical absolute base URL for metadata, canonicals, OG and the sitemap.
// Set NEXT_PUBLIC_SITE_URL in Vercel (e.g. https://spotted.app). Falls back to
// the Vercel-provided deployment URL, then localhost for dev.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'http://localhost:3000'
).replace(/\/$/, '');

export function absUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
