'use client';

import { useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import Media from '@/components/Media';
import { auth } from '@/lib/firebaseClient';
import type { User } from 'firebase/auth';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import ShortlistButton from '@/components/ShortlistButton';
import { HomeIcon, MapPinIcon } from '@/components/icons';

export default function ProfilePage() {
  const [mode, setMode] = useState<'tenant' | 'scout'>('tenant');
  const toggle = (
    <div className="inline-flex border-2 border-ink rounded-full overflow-hidden shadow-offsetSm text-xs font-bold">
      <button type="button" aria-pressed={mode === 'tenant'} onClick={() => setMode('tenant')} className={`flex items-center gap-1 px-3 py-2 ${mode === 'tenant' ? 'bg-pink text-paper' : 'bg-paper'}`}><HomeIcon className="w-4 h-4" /> Tenant</button>
      <button type="button" aria-pressed={mode === 'scout'} onClick={() => setMode('scout')} className={`px-3 py-2 border-l-2 border-ink ${mode === 'scout' ? 'bg-pink text-paper' : 'bg-paper'}`}>Scout</button>
    </div>
  );
  return (
    <main className="max-w-5xl mx-auto px-5">
      <TopBar eyebrow="Your account" title="Profile" action={toggle} />
      <AuthGate>{(user) => (mode === 'scout' ? <Stats user={user} /> : <TenantView user={user} />)}</AuthGate>
    </main>
  );
}

function TenantView({ user }: { user: User }) {
  const [unlocks, setUnlocks] = useState<any[] | null>(null);
  const [shortlist, setShortlist] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [u, s] = await Promise.all([
        fetch('/api/tenant/unlocks', { headers }).then((r) => r.json()).catch(() => ({ unlocks: [] })),
        fetch('/api/shortlist', { headers }).then((r) => r.json()).catch(() => ({ listings: [] }))
      ]);
      setUnlocks(u.unlocks ?? []);
      setShortlist(s.listings ?? []);
    })();
  }, [user]);

  return (
    <>
      <h2 className="text-lg mb-3">Unlocked contacts</h2>
      {unlocks === null ? <p className="text-sm text-slate">Loading…</p> : unlocks.length === 0 ? (
        <div className="sticker p-5 text-sm text-slate">No unlocked properties yet. Unlock a listing to save the owner&apos;s contact here.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {unlocks.map((u) => (
            <div key={u.id} className="sticker p-4">
              <div className="flex justify-between gap-2"><b>{u.listing ? `${u.listing.bhk} BHK · ${u.listing.landmark ?? 'Area'}` : 'Listing'}</b>{u.listing && <span className="font-mono font-bold">₹{Number(u.listing.rent).toLocaleString('en-IN')}</span>}</div>
              {u.owner?.name && <p className="text-sm mt-2">{u.owner.name}</p>}
              {u.owner?.phone && <a className="font-mono underline text-sm" href={`tel:${u.owner.phone}`}>{u.owner.phone}</a>}
              <div className="flex gap-2 mt-3">
                {u.listing && <Link href={`/listing/${u.id}`} className="btn btn-sm">View</Link>}
                {typeof u.location?.lat === 'number' && typeof u.location?.lng === 'number' && (
                  <a className="btn btn-sm btn-dark" href={`https://www.google.com/maps/search/?api=1&query=${u.location.lat},${u.location.lng}`} target="_blank" rel="noopener noreferrer"><MapPinIcon className="w-4 h-4" /> Map</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg mt-8 mb-3">Shortlisted</h2>
      {shortlist === null ? <p className="text-sm text-slate">Loading…</p> : shortlist.length === 0 ? (
        <div className="sticker p-5 text-sm text-slate">Nothing saved yet. Tap the heart on any listing to shortlist it.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortlist.map((l) => (
            <Link key={l.id} href={`/listing/${l.id}`} className="sticker p-4 relative hover:-translate-y-1 transition-transform">
              <ShortlistButton id={l.id} className="absolute top-3 right-3" />
              <b className="text-sm">{l.bhk} BHK</b>
              <p className="text-xs text-slate mt-1 flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" /> {l.landmark}</p>
              <p className="font-mono font-bold mt-2">₹{Number(l.rent).toLocaleString('en-IN')}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Stats({ user }: { user: User }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = await user.getIdToken();
      try {
        const res = await fetch('/api/scout/stats', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(7000) });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not load your dashboard.');
        setData(body);
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not load your dashboard.'); }
    })();
  }, [user]);

  if (!data) return <div className="sticker p-5 bg-yellowSoft"><p className="font-bold">{error ? 'Your dashboard is temporarily unavailable.' : 'Loading your dashboard…'}</p>{error && <p className="text-sm text-slate mt-1">Please check your database connection and refresh.</p>}</div>;

  const cards = [
    ['Verified discoveries', data.verifiedDiscoveries],
    ['Successful connections', data.successfulConnections],
    ['Pending earnings', `₹${data.scout.pendingEarnings}`],
    ['Available earnings', `₹${data.scout.availableEarnings}`],
    ['Total earned', `₹${data.scout.totalEarned}`]
  ];

  return (
    <>
      <p className="text-sm text-slate-500 mb-4">
        Trust score: <b className="font-mono">{data.scout.trustScore}/100</b>
      </p>
      <div className="sticker bg-yellowSoft p-4 mb-5 flex flex-wrap gap-3 items-center justify-between">
        <div><p className="font-bold">Spot a TO-LET board?</p><p className="text-xs text-slate">Submit it in under two minutes and earn when renters unlock it.</p></div>
        <Link className="btn btn-sm btn-primary" href="/scout">Submit a discovery →</Link>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))' }}>
        {cards.map(([label, value]) => (
          <div key={label as string} className="sticker p-4">
            <div className="font-mono text-2xl font-bold">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-lg mt-8 mb-3">Your submissions</h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
        {data.submissions.map((s: any) => (
          <div key={s.id} className="sticker overflow-hidden">
            <div className="relative h-28 bg-yellowSoft border-b-2 border-ink overflow-hidden">
              <Media url={s.media} emoji="🏠" alt={`${s.bhk} BHK`} className="w-full h-full object-cover" emojiClassName="absolute inset-0 flex items-center justify-center text-4xl" />
              <span className={`badge absolute top-2 right-2 ${s.status === 'verified' ? 'badge-green' : s.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>{s.status}</span>
            </div>
            <div className="p-3">
              <b className="text-sm">{s.bhk} BHK · {s.landmark ?? 'Unknown area'}</b>
              <p className="text-xs text-slate mt-1 font-mono">Quality {s.trustScore ?? 0}/100{Array.isArray(s.mediaUrls) && s.mediaUrls.length > 1 ? ` · ${s.mediaUrls.length} files` : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
