'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Carousel from '@/components/Carousel';
import Reveal from '@/components/Reveal';
import { CheckIcon } from '@/components/icons';

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  useEffect(() => { fetch('/api/listings').then((res) => res.ok ? res.json() : null).then((data) => setListings(data?.listings ?? [])).catch(() => {}); }, []);
  const latest = listings[0] ?? null;
  return (
    <main>
      <section className="max-w-5xl mx-auto px-5 pt-10 pb-8 grid md:grid-cols-[1.1fr_.9fr] gap-8 items-center">
        <div className="animate-fade-up"><p className="section-label mb-3">● Live discoveries across Bengaluru</p>
          <h1 className="text-4xl md:text-6xl">Find rentals the <span className="bg-yellow px-2">internet missed.</span></h1>
          <p className="text-ink/70 max-w-md mt-5 mb-6 leading-relaxed">Real homes spotted on real streets — verified, fresh, and shared with you before they disappear.</p>
          <div className="flex gap-3 flex-wrap"><Link href="/discover" className="btn btn-primary press">Explore rentals <span>→</span></Link><Link href="/scout" className="btn btn-yellow press">I spotted a board</Link></div>
          <p className="font-mono text-[11px] text-slate mt-5">No brokers. No endless walking. From ₹29 to connect.</p></div>
        <div className="sticker bg-yellow p-5 rotate-1 relative overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}><div className="absolute -right-4 -top-4 text-8xl opacity-20">📍</div><p className="section-label">{latest ? 'Just spotted' : 'Your local network'}</p><h2 className="text-2xl mt-2">{latest ? `${latest.bhk} BHK in ${latest.landmark}` : 'The next home is around the corner.'}</h2>{latest && <p className="font-mono font-bold text-xl mt-2">₹{latest.rent.toLocaleString('en-IN')} <span className="text-xs font-normal">/ month</span></p>}<div className="mt-5 bg-paper border-2 border-ink rounded-xl p-3 text-sm">{latest ? <><div className="flex justify-between"><span>Approx. {latest.landmark}</span><span>Trust {latest.trustScore}</span></div><div className="flex mt-3"><span className={`badge ${latest.status === 'verified' ? 'badge-green' : 'badge-yellow'}`}>{latest.status === 'verified' ? <><CheckIcon className="w-3 h-3" /> Owner verified</> : 'Community spotted'}</span><Link href={`/listing/${latest.id}`} className="ml-auto text-xs font-bold underline">View →</Link></div></> : <p className="leading-relaxed">Scouts spot fresh TO-LET boards and renters connect directly — without walking every lane.</p>}</div></div>
      </section>

      {listings.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 py-8">
          <div className="flex justify-between items-end mb-4"><div><p className="section-label mb-1">● Fresh on the street</p><h2 className="text-2xl">Just spotted near you.</h2></div><Link href="/discover" className="text-sm font-bold underline">Explore all</Link></div>
          <Reveal><Carousel slides={listings.slice(0, 6)} /></Reveal>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex justify-between items-end mb-4"><div><p className="section-label mb-1">A better way to rent</p><h2 className="text-2xl">The neighbourhood knows first.</h2></div><Link href="/discover" className="text-sm font-bold underline">See all rentals</Link></div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            ['Search', 'Browse fresh rental opportunities near you.'],
            ['Verify', 'See freshness, verification status and approximate location.'],
            ['Connect', "Pay a small fee to unlock the owner's contact."]
          ].map(([title, body], i) => (
            <Reveal key={title} delay={i * 90} className="sticker p-5">
              <h3 className="text-lg mb-1">{title}</h3>
              <p className="text-sm text-ink/70">{body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-8">
        <div className="sticker bg-ink text-paper p-6 md:p-8 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center">
          <div><p className="section-label text-yellow mb-2">Earn from your neighbourhood</p><h2 className="text-2xl">See a board? Turn it into a useful lead.</h2><p className="text-sm text-paper/70 max-w-xl mt-2">Anyone can scout. Share a genuine rental, our team verifies it, and you earn for successful renter connections.</p></div>
          <Link href="/scout" className="btn btn-yellow shrink-0">Become a Scout →</Link>
        </div>
      </section>
    </main>
  );
}
