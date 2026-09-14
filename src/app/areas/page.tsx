import type { Metadata } from 'next';
import Link from 'next/link';
import { AREAS } from '@/content/areas';
import { getPublicFeed } from '@/lib/listings';
import { computeRentStats } from '@/lib/areaStats';
import { absUrl } from '@/lib/site';
import AreaGraphic from '@/components/AreaGraphic';
import { MapPinIcon, ChevronRightIcon, StarIcon } from '@/components/icons';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Bengaluru area guides — where to rent, reviewed | spotted',
  description:
    'Honest neighbourhood guides to renting in Bengaluru — HSR Layout, Koramangala, Indiranagar, Whitefield, BTM and more. Vibe, commute, rent stats and a Spotted rating for each area.',
  alternates: { canonical: absUrl('/areas') },
  openGraph: {
    title: 'Bengaluru area guides — where to rent, reviewed',
    description: 'Honest neighbourhood rental guides with rent stats and a Spotted rating for each Bengaluru area.',
    url: absUrl('/areas'),
    type: 'website'
  }
};

export default async function AreasIndex() {
  const feed = await getPublicFeed(500).catch(() => [] as any[]);
  const areas = AREAS.map((a) => ({ area: a, stats: computeRentStats(feed, a) }))
    .sort((a, b) => b.stats.count - a.stats.count || b.area.rating.overall - a.area.rating.overall);

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Bengaluru rental area guides',
    itemListElement: areas.map(({ area }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absUrl(`/areas/${area.slug}`),
      name: `${area.name} rental guide`
    }))
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Area guides', item: absUrl('/areas') }
    ]
  };

  return (
    <main className="max-w-6xl mx-auto px-5 md:px-6 pt-8 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="text-xs text-slate flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRightIcon className="w-3.5 h-3.5" />
        <span className="text-ink font-medium">Area guides</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <p className="section-label">Bengaluru neighbourhood guides</p>
        <h1 className="text-3xl sm:text-4xl mt-2">Where should you rent in Bengaluru?</h1>
        <p className="text-slate mt-3 leading-relaxed">
          Honest, on-the-ground guides to the city&apos;s most-rented areas — the vibe, the commute, what you&apos;ll
          actually pay, and a <b className="text-ink">Spotted rating</b> for each. Every guide links to fresh listings
          our scouts have found on the street.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {areas.map(({ area, stats }) => (
          <Link key={area.slug} href={`/areas/${area.slug}`} className="sticker overflow-hidden hover:-translate-y-0.5 transition-transform group">
            <div className="h-32 relative flex items-end p-4 overflow-hidden">
              {area.image
                ? <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[600ms] group-hover:scale-105" style={{ backgroundImage: `url(${area.image})` }} />
                : <div className="absolute inset-0 transition-transform duration-[600ms] group-hover:scale-105"><AreaGraphic area={area} /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-full text-xs font-bold text-ink"><StarIcon className="w-3 h-3 text-yellow" /> {area.rating.overall.toFixed(1)}</span>
              <h2 className="relative text-xl text-white flex items-center gap-1.5"><MapPinIcon className="w-4 h-4" /> {area.name}</h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate leading-snug line-clamp-2">{area.tagline}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line text-xs">
                <span className="text-slate">
                  {stats.count > 0 ? <><b className="text-ink font-mono">{stats.count}</b> live {stats.count === 1 ? 'home' : 'homes'}</> : 'Guide + rent insights'}
                </span>
                {stats.avgRent != null && <span className="text-slate">~<b className="text-ink font-mono">₹{stats.avgRent.toLocaleString('en-IN')}</b>/mo</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate mt-8">
        Rent figures are medians computed live from listings our scouts have spotted, and refresh through the day.
        The Spotted rating is our editorial score — community ratings are coming soon.
      </p>
    </main>
  );
}
