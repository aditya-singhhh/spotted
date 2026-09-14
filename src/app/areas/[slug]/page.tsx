import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AREAS, getArea } from '@/content/areas';
import { getPublicFeed } from '@/lib/listings';
import { computeRentStats, listingInArea } from '@/lib/areaStats';
import { absUrl } from '@/lib/site';
import Stars from '@/components/Stars';
import Media from '@/components/Media';
import { MapPinIcon, ChevronRightIcon, CheckIcon, XIcon, ArrowRightIcon } from '@/components/icons';

export const revalidate = 600;

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const area = getArea(params.slug);
  if (!area) return { title: 'Area guide — spotted' };
  const title = `${area.name} rental guide — rent, vibe & areas review | spotted`;
  const description = `${area.tagline} Read our honest ${area.name} guide: what it's like to live there, commute, rent ranges and a Spotted rating of ${area.rating.overall}/5.`;
  const url = absUrl(`/areas/${area.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title, description }
  };
}

const SUBSCORES: [keyof import('@/content/areas').AreaRating, string][] = [
  ['connectivity', 'Connectivity'],
  ['value', 'Value for money'],
  ['safety', 'Safety'],
  ['amenities', 'Amenities'],
  ['green', 'Green & quiet']
];

export default async function AreaGuide({ params }: { params: { slug: string } }) {
  const area = getArea(params.slug);
  if (!area) notFound();

  const feed = await getPublicFeed(500).catch(() => [] as any[]);
  const stats = computeRentStats(feed, area);
  const listings = feed.filter((l) => listingInArea(l, area)).slice(0, 6);

  const placeLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${area.name}, Bengaluru`,
    description: area.intro,
    address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressRegion: 'Karnataka', addressCountry: 'IN' },
    geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: area.rating.overall, bestRating: 5, ratingCount: 1, author: { '@type': 'Organization', name: 'spotted' } }
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Area guides', item: absUrl('/areas') },
      { '@type': 'ListItem', position: 3, name: area.name, item: absUrl(`/areas/${area.slug}`) }
    ]
  };
  const browseHref = `/discover?query=${encodeURIComponent(area.name)}`;

  return (
    <main className="max-w-5xl mx-auto px-5 md:px-6 pt-6 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="text-xs text-slate flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <Link href="/areas" className="hover:text-ink">Area guides</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-ink font-medium">{area.name}</span>
      </nav>

      {/* Hero */}
      <header className="sticker overflow-hidden mt-4">
        <div className="p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${area.tint}1f, ${area.tint}08)` }}>
          <p className="section-label flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5" /> Bengaluru · Area guide</p>
          <h1 className="text-3xl sm:text-4xl mt-2">{area.name}</h1>
          <p className="text-slate mt-2 max-w-2xl leading-relaxed">{area.tagline}</p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="rounded-xl bg-paper border border-line px-3.5 py-2.5 flex items-center gap-2.5">
              <span className="text-2xl font-mono font-bold">{area.rating.overall.toFixed(1)}</span>
              <div>
                <Stars value={area.rating.overall} className="w-4 h-4" />
                <p className="text-[11px] text-slate mt-0.5">Spotted rating</p>
              </div>
            </div>
            <div className="rounded-xl bg-paper/60 border border-dashed border-line px-3.5 py-2.5">
              <p className="text-sm font-semibold text-slate">Community rating</p>
              <p className="text-[11px] text-slate mt-0.5">Coming soon — be the first to review</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 mt-8 items-start">
        {/* Editorial article */}
        <article className="space-y-6">
          <p className="text-lg leading-relaxed">{area.intro}</p>

          {area.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl mb-2">{s.heading}</h2>
              <p className="text-slate leading-relaxed">{s.body}</p>
            </section>
          ))}

          {/* Pros / cons */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="panel p-4">
              <p className="section-label text-green mb-2">What&apos;s great</p>
              <ul className="space-y-2">
                {area.pros.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm"><CheckIcon className="w-4 h-4 text-green shrink-0 mt-0.5" /> {p}</li>
                ))}
              </ul>
            </div>
            <div className="panel p-4">
              <p className="section-label text-slate mb-2">Keep in mind</p>
              <ul className="space-y-2">
                {area.cons.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm"><XIcon className="w-4 h-4 text-slate shrink-0 mt-0.5" /> {c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Live listings */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl">Homes spotted in {area.name}</h2>
              {stats.count > 0 && <Link href={browseHref} className="text-sm font-semibold text-accent whitespace-nowrap">See all {stats.count} →</Link>}
            </div>
            {listings.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {listings.map((l) => (
                  <Link key={l.id} href={`/listing/${l.id}`} className="sticker overflow-hidden hover:-translate-y-0.5 transition-transform">
                    <div className="relative aspect-[16/10] bg-canvas">
                      <Media url={l.media} emoji="🏠" alt={`${l.bhk} BHK in ${l.landmark}`} className="w-full h-full object-cover" emojiClassName="flex items-center justify-center w-full h-full text-4xl" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold">{l.bhk} BHK</span>
                        <span className="font-mono font-bold">₹{Number(l.rent).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate mt-1 flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5 shrink-0" /> {l.landmark}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="panel p-6 text-center">
                <p className="text-sm text-slate">No live listings in {area.name} right now — new ones get spotted often.</p>
                <Link href={browseHref} className="btn btn-sm btn-dark mt-3 inline-flex">Browse nearby homes</Link>
              </div>
            )}
          </section>

          <Link href={browseHref} className="btn btn-primary w-full sm:w-auto">
            Browse {stats.count > 0 ? `${stats.count} ` : ''}homes in {area.name} <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </article>

        {/* Sidebar: rating breakdown + rent stats + nearby */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="sticker p-5">
            <p className="section-label mb-3">Spotted rating breakdown</p>
            <div className="space-y-2.5">
              {SUBSCORES.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-slate w-28 shrink-0">{label}</span>
                  <div className="meter flex-1"><span className="bg-accent" style={{ width: `${(area.rating[key] / 5) * 100}%` }} /></div>
                  <span className="text-sm font-mono w-7 text-right">{area.rating[key].toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {stats.count > 0 && (
            <div className="sticker p-5">
              <p className="section-label mb-3">Rent snapshot · live</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="panel p-3">
                  <p className="font-mono text-xl font-bold">{stats.avgRent != null ? `₹${stats.avgRent.toLocaleString('en-IN')}` : '—'}</p>
                  <p className="text-[11px] text-slate mt-0.5">Median rent</p>
                </div>
                <div className="panel p-3">
                  <p className="font-mono text-xl font-bold">{stats.count}</p>
                  <p className="text-[11px] text-slate mt-0.5">Live homes{stats.freshCount > 0 ? ` · ${stats.freshCount} fresh` : ''}</p>
                </div>
              </div>
              {stats.byBhk.length > 0 && (
                <div className="divide-y divide-line mt-3 border-t border-line">
                  {stats.byBhk.map((b) => (
                    <div key={b.bhk} className="flex justify-between py-2 text-sm">
                      <span className="text-slate">{b.bhk} BHK <span className="text-xs">({b.count})</span></span>
                      <b className="font-mono">{b.avgRent != null ? `₹${b.avgRent.toLocaleString('en-IN')}` : '—'}</b>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate mt-3">Medians from listings scouts spotted. Confirm with the owner after unlocking.</p>
            </div>
          )}

          <div className="sticker p-5">
            <p className="section-label mb-2">Best for</p>
            <div className="flex flex-wrap gap-2">
              {area.bestFor.map((b) => <span key={b} className="badge badge-accent">{b}</span>)}
            </div>
            <p className="section-label mb-2 mt-4">Nearby &amp; landmarks</p>
            <ul className="space-y-1.5">
              {area.nearby.map((n) => (
                <li key={n} className="text-sm text-slate flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 shrink-0" /> {n}</li>
              ))}
            </ul>
          </div>

          <div className="panel p-4">
            <p className="section-label mb-2">More area guides</p>
            <div className="flex flex-col">
              {AREAS.filter((a) => a.slug !== area.slug).slice(0, 4).map((a) => (
                <Link key={a.slug} href={`/areas/${a.slug}`} className="flex items-center justify-between py-2 text-sm hover:text-accent border-b border-line last:border-0">
                  {a.name} <ChevronRightIcon className="w-4 h-4 text-slate" />
                </Link>
              ))}
              <Link href="/areas" className="text-sm font-semibold text-accent pt-2">All Bengaluru areas →</Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
