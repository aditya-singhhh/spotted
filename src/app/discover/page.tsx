'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Media from '@/components/Media';
import { getCurrentLocation, reverseGeocode } from '@/lib/geo';
import { MapPinIcon, CheckIcon, SearchIcon, XIcon, ShieldCheckIcon } from '@/components/icons';
import ShortlistButton from '@/components/ShortlistButton';
import ListingsMap from '@/components/ListingsMap';
import { readCache, writeCache } from '@/lib/clientCache';

type Listing = { id: string; bhk: number; rent: number; deposit: number; furnishing: string; bachelorAllowed: string; status: string; trustScore: number; landmark: string; kmAway?: number; photo?: string; media?: string | null; beds?: string; freshness?: string; spottedAt?: string; approxLat?: number; approxLng?: number };
type Sort = 'fresh' | 'priceLow' | 'priceHigh' | 'trust';

export default function DiscoverPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [locating, setLocating] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bhk, setBhk] = useState('');
  const [budget, setBudget] = useState('');
  const [bachelors, setBachelors] = useState(false);
  const [sort, setSort] = useState<Sort>('fresh');
  const [view, setView] = useState<'list' | 'map'>('list');

  async function load(lat?: number, lng?: number) {
    setLoadError('');
    const useCache = !lat && !lng;
    const cached = useCache ? readCache<Listing[]>('feed:discover') : null;
    if (cached) { setListings(cached); setLoading(false); } else { setLoading(true); }
    try {
      const params = new URLSearchParams();
      if (lat && lng) { params.set('lat', `${lat}`); params.set('lng', `${lng}`); }
      const res = await fetch(`/api/listings?${params}`);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;
      if (!res.ok) throw new Error(data?.error || 'The server returned an error. Please try again.');
      if (!data) throw new Error('No listing data was returned. Please try again.');
      const list = data.listings || [];
      setListings(list);
      if (useCache) writeCache('feed:discover', list);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load live rentals.');
      if (!cached) setListings([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const qp = sp.get('query'); if (qp) setQuery(qp);
    const bp = sp.get('bhk'); if (bp) setBhk(bp);
    const bud = sp.get('budget'); if (bud) setBudget(bud);
    load();
  }, []);

  async function handleNearMe() {
    setLocating(true);
    try { const loc = await getCurrentLocation(); setPlaceName(await reverseGeocode(loc)); await load(loc.lat, loc.lng); }
    catch { alert("Couldn't get your location — please allow location access and try again."); }
    finally { setLocating(false); }
  }

  const filtered = useMemo(() => {
    let r = listings.filter((l) =>
      (!query || l.landmark.toLowerCase().includes(query.toLowerCase())) &&
      (!bhk || l.bhk === Number(bhk)) &&
      (!budget || l.rent <= Number(budget)) &&
      (!bachelors || l.bachelorAllowed === 'yes'));
    const by: Record<Sort, (a: Listing, b: Listing) => number> = {
      fresh: () => 0,
      priceLow: (a, b) => a.rent - b.rent,
      priceHigh: (a, b) => b.rent - a.rent,
      trust: (a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0)
    };
    return sort === 'fresh' ? r : [...r].sort(by[sort]);
  }, [listings, query, bhk, budget, bachelors, sort]);

  const chips = [
    query && { label: `“${query}”`, clear: () => setQuery('') },
    bhk && { label: `${bhk} BHK`, clear: () => setBhk('') },
    budget && { label: `≤ ₹${Number(budget).toLocaleString('en-IN')}`, clear: () => setBudget('') },
    bachelors && { label: 'Bachelor friendly', clear: () => setBachelors(false) }
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <main className="max-w-6xl mx-auto px-5 pb-10">
      <div className="pt-8 pb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label mb-2">Bengaluru rental network</p>
          <h1 className="text-3xl sm:text-4xl">Fresh homes, before the crowd.</h1>
        </div>
        <button onClick={handleNearMe} disabled={locating} className={`btn btn-sm shrink-0 ${placeName ? 'btn-primary' : ''}`}>
          <MapPinIcon className="w-4 h-4" /> {locating ? 'Locating…' : placeName ? `Near ${placeName}` : 'Near me'}
        </button>
      </div>

      <div className="sticky top-14 md:top-16 z-30 -mx-5 px-5 py-3 bg-canvas/90 backdrop-blur border-b border-line mb-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_auto] gap-2">
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="input pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search an area…" />
          </div>
          <select className="input" value={bhk} onChange={(e) => setBhk(e.target.value)}><option value="">Any size</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option></select>
          <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)}><option value="">Any budget</option><option value="20000">Under ₹20,000</option><option value="30000">Under ₹30,000</option><option value="45000">Under ₹45,000</option></select>
          <button onClick={() => setBachelors(!bachelors)} aria-pressed={bachelors} className={`btn shrink-0 ${bachelors ? 'btn-primary' : ''}`}>{bachelors && <CheckIcon className="w-4 h-4" />} Bachelor</button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-sm text-slate">{loading && !filtered.length ? 'Finding homes…' : <><b className="text-ink">{filtered.length}</b> {filtered.length === 1 ? 'home' : 'homes'} found</>}</p>
        <div className="flex items-center gap-3">
          <div className="inline-flex border border-line rounded-lg overflow-hidden text-sm font-medium">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={`px-3 py-1.5 ${view === 'list' ? 'bg-ink text-white' : 'bg-paper hover:bg-canvas'}`}>List</button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')} className={`px-3 py-1.5 border-l border-line ${view === 'map' ? 'bg-ink text-white' : 'bg-paper hover:bg-canvas'}`}>Map</button>
          </div>
          {view === 'list' && (
            <label className="flex items-center gap-2 text-sm text-slate">
              Sort by
              <select className="input !py-1.5 !w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="fresh">Freshest</option><option value="priceLow">Price: low to high</option><option value="priceHigh">Price: high to low</option><option value="trust">Trust score</option>
              </select>
            </label>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 text-xs font-medium bg-accentSoft text-accent border border-accent/20 rounded-full pl-3 pr-2 py-1 hover:brightness-95">{c.label}<XIcon className="w-3 h-3" /></button>
          ))}
          <button onClick={() => { setQuery(''); setBhk(''); setBudget(''); setBachelors(false); }} className="text-xs font-semibold text-slate hover:text-ink underline">Clear all</button>
        </div>
      )}

      {loadError && (
        <div className="panel border-red/30 bg-redSoft p-4 mb-5 text-sm flex flex-wrap items-center justify-between gap-3">
          <div><b>Live listings are unavailable.</b><p className="mt-1 text-slate">{loadError}</p></div>
          <button className="btn btn-sm" onClick={() => load()}>Retry</button>
        </div>
      )}

      {view === 'map' ? (
        filtered.length ? <ListingsMap items={filtered} /> : <div className="panel p-10 text-center">No mappable homes for these filters.</div>
      ) : (<>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && !filtered.length
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk${i}`} className="panel overflow-hidden"><div className="h-40 skeleton" /><div className="p-4 space-y-2.5"><div className="h-5 w-24 skeleton rounded" /><div className="h-3 w-32 skeleton rounded" /><div className="h-3 w-20 skeleton rounded" /></div></div>
            ))
          : filtered.map((l, i) => <ListingCard key={l.id} l={l} delay={Math.min(i, 10) * 40} />)}
      </div>

      {!loading && !filtered.length && !loadError && (
        <div className="panel p-10 text-center mt-2">
          <div className="w-12 h-12 rounded-xl bg-accentSoft text-accent flex items-center justify-center mx-auto mb-3"><SearchIcon className="w-6 h-6" /></div>
          <p className="text-lg font-semibold">No homes match these filters</p>
          <p className="text-sm text-slate mt-1">Try widening your search, or submit a discovery as a scout.</p>
          {chips.length > 0 && <button onClick={() => { setQuery(''); setBhk(''); setBudget(''); setBachelors(false); }} className="btn btn-sm mt-4">Clear filters</button>}
        </div>
      )}
      </>)}
    </main>
  );
}

function ListingCard({ l, delay }: { l: Listing; delay: number }) {
  return (
    <Link href={`/listing/${l.id}`} style={{ animationDelay: `${delay}ms` }} className="panel panel-hover overflow-hidden group animate-fade-up">
      <div className="relative h-44 bg-accentSoft overflow-hidden">
        <Media url={l.media} emoji={l.photo || '🏠'} alt={`${l.bhk} BHK in ${l.landmark}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" emojiClassName="absolute inset-0 flex items-center justify-center text-5xl" />
        <span className={`badge absolute top-3 right-3 ${l.status === 'verified' ? 'badge-green' : 'badge-yellow'}`}>{l.status === 'verified' ? <><CheckIcon className="w-3 h-3" /> Verified</> : 'Community'}</span>
        <ShortlistButton id={l.id} className="absolute top-2.5 left-2.5 bg-paper/90 backdrop-blur rounded-full p-1.5 border border-line shadow-offsetSm press" />
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg">{l.bhk} BHK</h3>
          <span className="font-mono font-bold">₹{l.rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate">/mo</span></span>
        </div>
        <p className="text-sm text-slate mt-1 flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5 shrink-0" /> {l.landmark}</p>
        <p className="text-xs text-slate mt-2 first-letter:uppercase">{l.beds || `${l.furnishing} · ${l.bachelorAllowed === 'yes' ? 'Bachelor friendly' : l.bachelorAllowed === 'no' ? 'Family home' : 'Ask owner'}`}</p>
        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-green font-medium"><ShieldCheckIcon className="w-3.5 h-3.5" /> Trust {l.trustScore}</span>
          <span className="text-slate">{l.kmAway !== undefined ? `${l.kmAway.toFixed(1)} km away` : l.freshness || 'Fresh today'}</span>
        </div>
      </div>
    </Link>
  );
}
