'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Media from '@/components/Media';
import ShortlistButton from '@/components/ShortlistButton';
import Reveal from '@/components/Reveal';
import { CheckIcon, SearchIcon, MapPinIcon, ShieldCheckIcon, SparkleIcon, TrendingUpIcon } from '@/components/icons';
import { readCache, writeCache } from '@/lib/clientCache';
import type { ComponentType } from 'react';

const STEPS: { Icon: ComponentType<{ className?: string }>; title: string; body: string }[] = [
  { Icon: SearchIcon, title: 'Search your area', body: 'Browse fresh, real rental boards spotted near you — filtered by size and budget.' },
  { Icon: ShieldCheckIcon, title: 'Check the trust', body: 'See verification status, a trust score and approximate location before you commit.' },
  { Icon: TrendingUpIcon, title: 'Connect directly', body: "Unlock the owner's contact for a small fee — no brokers, no runaround." }
];

export default function Home() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [bhk, setBhk] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    const cached = readCache<any[]>('feed:home');
    if (cached) setListings(cached);
    fetch('/api/listings').then((res) => (res.ok ? res.json() : null)).then((data) => {
      const l = data?.listings ?? [];
      setListings(l);
      writeCache('feed:home', l);
    }).catch(() => {});
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('query', q.trim());
    if (bhk) p.set('bhk', bhk);
    if (budget) p.set('budget', budget);
    router.push(`/discover${p.toString() ? `?${p}` : ''}`);
  }

  const featured = listings.slice(0, 3);

  return (
    <main>
      <section className="border-b border-line bg-gradient-to-b from-accentSoft/50 to-canvas">
        <div className="max-w-5xl mx-auto px-5 pt-14 sm:pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-1.5 badge badge-accent mb-6 animate-fade-up"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Live across Bengaluru</div>
          <h1 className="text-4xl sm:text-6xl max-w-3xl mx-auto animate-fade-up">Find rentals the <span className="text-accent">internet missed.</span></h1>
          <p className="text-slate text-lg max-w-xl mx-auto mt-5 animate-fade-up">Real homes spotted on real streets by your neighbours — verified, fresh, and broker-free.</p>

          <form onSubmit={search} className="mt-9 max-w-3xl mx-auto bg-paper border border-line rounded-2xl shadow-lift p-2 flex flex-col sm:flex-row gap-2 animate-fade-up text-left">
            <div className="flex-1 flex items-center gap-2 px-3">
              <MapPinIcon className="w-5 h-5 text-slate shrink-0" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search an area — HSR, Indiranagar…" className="w-full py-3 bg-transparent outline-none text-sm" />
            </div>
            <select value={bhk} onChange={(e) => setBhk(e.target.value)} className="px-3 py-2.5 rounded-xl border border-line bg-paper text-sm sm:w-32">
              <option value="">Any BHK</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option>
            </select>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="px-3 py-2.5 rounded-xl border border-line bg-paper text-sm sm:w-40">
              <option value="">Any budget</option><option value="20000">Under ₹20k</option><option value="30000">Under ₹30k</option><option value="45000">Under ₹45k</option>
            </select>
            <button className="btn btn-primary px-6"><SearchIcon className="w-4 h-4" /> Search</button>
          </form>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-8 text-sm text-slate animate-fade-up">
            <span className="flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4 text-green" /> Owner-verified listings</span>
            <span className="flex items-center gap-1.5"><SparkleIcon className="w-4 h-4 text-accent" /> Fresh every day</span>
            <span className="flex items-center gap-1.5"><CheckIcon className="w-4 h-4 text-green" /> Zero brokerage</span>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 py-14 sm:py-16">
          <div className="flex items-end justify-between mb-6">
            <div><p className="section-label mb-1">Fresh on the street</p><h2 className="text-2xl sm:text-3xl">Just spotted near you</h2></div>
            <Link href="/discover" className="text-sm font-semibold text-accent shrink-0">View all →</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l, i) => <FeaturedCard key={l.id} l={l} delay={i * 80} />)}
          </div>
        </section>
      )}

      <section id="how-it-works" className="border-y border-line bg-paper scroll-mt-20">
        <div className="max-w-5xl mx-auto px-5 py-14 sm:py-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="section-label mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl">Three steps to your next home</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="w-11 h-11 rounded-xl bg-accentSoft text-accent flex items-center justify-center mb-4"><Icon className="w-5 h-5" /></div>
                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-slate">0{i + 1}</span><h3 className="text-lg">{title}</h3></div>
                <p className="text-sm text-slate leading-relaxed">{body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-14 sm:py-16">
        <div className="rounded-3xl bg-ink text-paper p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row gap-6 justify-between md:items-center">
            <div className="max-w-xl">
              <p className="section-label !text-accent mb-3">Earn from your neighbourhood</p>
              <h2 className="text-2xl sm:text-3xl">See a board? Turn it into a useful lead.</h2>
              <p className="text-paper/70 mt-3">Anyone can scout. Share a genuine rental, our team verifies it, and you earn every time a renter unlocks it.</p>
            </div>
            <Link href="/scout" className="btn bg-paper text-ink border-paper hover:bg-white shrink-0">Become a scout →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeaturedCard({ l, delay }: { l: any; delay: number }) {
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
        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-green"><ShieldCheckIcon className="w-3.5 h-3.5" /> Trust {l.trustScore}</span>
          <span className="text-accent font-semibold">View →</span>
        </div>
      </div>
    </Link>
  );
}
