'use client';

import { useEffect, useState, type ReactNode } from 'react';
import AuthGate from '@/components/AuthGate';
import Media from '@/components/Media';
import { auth } from '@/lib/firebaseClient';
import type { User } from 'firebase/auth';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import ShortlistButton from '@/components/ShortlistButton';
import { HomeIcon, MapPinIcon, WalletIcon, TrendingUpIcon, ShieldCheckIcon, SparkleIcon } from '@/components/icons';

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

const inr = (n: unknown) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="text-lg">{title}</h2>
      {typeof count === 'number' && <span className="section-label">{count} total</span>}
    </div>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return <div className="panel p-6 text-sm text-slate">{children}</div>;
}

function LoadingRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1].map((i) => <div key={i} className="panel p-4"><div className="h-4 w-28 skeleton rounded" /><div className="h-3 w-20 skeleton rounded mt-3" /></div>)}
    </div>
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
    <div className="space-y-8 animate-fade-up">
      <section>
        <SectionHead title="Unlocked contacts" count={unlocks?.length} />
        {unlocks === null ? <LoadingRow /> : unlocks.length === 0 ? (
          <EmptyPanel>No unlocked properties yet. Unlock a listing to keep the owner&apos;s contact here.</EmptyPanel>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {unlocks.map((u) => (
              <div key={u.id} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{u.listing ? `${u.listing.bhk} BHK` : 'Listing'}</p>
                    <p className="text-xs text-slate flex items-center gap-1 mt-0.5"><MapPinIcon className="w-3.5 h-3.5 shrink-0" /> {u.listing?.landmark ?? 'Area'}</p>
                  </div>
                  {u.listing && <span className="font-mono font-bold">{inr(u.listing.rent)}</span>}
                </div>
                {(u.owner?.name || u.owner?.phone) && (
                  <div className="mt-3 pt-3 border-t border-ink/10">
                    {u.owner?.name && <p className="text-sm font-semibold">{u.owner.name}</p>}
                    {u.owner?.phone && <a className="font-mono text-sm underline" href={`tel:${u.owner.phone}`}>{u.owner.phone}</a>}
                  </div>
                )}
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
      </section>

      <section>
        <SectionHead title="Shortlisted" count={shortlist?.length} />
        {shortlist === null ? <LoadingRow /> : shortlist.length === 0 ? (
          <EmptyPanel>Nothing saved yet. Tap the heart on any listing to shortlist it.</EmptyPanel>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortlist.map((l) => (
              <Link key={l.id} href={`/listing/${l.id}`} className="panel panel-hover p-4 relative">
                <ShortlistButton id={l.id} className="absolute top-3 right-3" />
                <p className="font-semibold pr-7">{l.bhk} BHK</p>
                <p className="text-xs text-slate mt-1 flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5 shrink-0" /> {l.landmark}</p>
                <p className="font-mono font-bold mt-3">{inr(l.rent)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-slate">{icon}<span className="section-label">{label}</span></div>
      <p className="font-display text-3xl mt-2 leading-none">{value}</p>
    </div>
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

  if (!data) return <div className="panel p-6"><p className="font-semibold">{error ? 'Your dashboard is temporarily unavailable.' : 'Loading your dashboard…'}</p>{error && <p className="text-sm text-slate mt-1">Please check your connection and refresh.</p>}</div>;

  const s = data.scout;
  const trust = Math.max(0, Math.min(100, Number(s.trustScore ?? 0)));

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-2xl bg-ink text-paper p-5 sm:p-6">
        <div className="flex items-center gap-2 text-paper/60"><WalletIcon className="w-4 h-4" /><span className="section-label !text-paper/60">Available to withdraw</span></div>
        <p className="font-display text-4xl sm:text-5xl mt-2 leading-none">{inr(s.availableEarnings)}</p>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-paper/15">
          <div><p className="text-[11px] uppercase tracking-wide text-paper/50">Pending</p><p className="font-mono text-xl font-bold mt-1">{inr(s.pendingEarnings)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-paper/50">Total earned</p><p className="font-mono text-xl font-bold mt-1">{inr(s.totalEarned)}</p></div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi icon={<ShieldCheckIcon className="w-4 h-4" />} label="Verified discoveries" value={data.verifiedDiscoveries} />
        <Kpi icon={<TrendingUpIcon className="w-4 h-4" />} label="Successful connections" value={data.successfulConnections} />
        <div className="panel p-4">
          <div className="flex items-center gap-2 text-slate"><SparkleIcon className="w-4 h-4" /><span className="section-label">Trust score</span></div>
          <p className="font-display text-3xl mt-2 leading-none">{trust}<span className="text-base text-slate font-body font-normal">/100</span></p>
          <div className="meter mt-3"><span className="bg-green" style={{ width: `${trust}%` }} /></div>
        </div>
      </div>

      <div className="panel p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">Spotted a TO-LET board?</p><p className="text-sm text-slate mt-0.5">Submit it in under two minutes and earn when renters unlock it.</p></div>
        <Link className="btn btn-sm btn-primary" href="/scout">Submit a discovery →</Link>
      </div>

      <section>
        <SectionHead title="Your submissions" count={data.submissions.length} />
        {data.submissions.length === 0 ? (
          <EmptyPanel>No submissions yet — your first discovery will appear here.</EmptyPanel>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
            {data.submissions.map((sub: any) => {
              const q = Math.max(0, Math.min(100, Number(sub.trustScore ?? 0)));
              const bar = q >= 70 ? 'bg-green' : q >= 40 ? 'bg-yellow' : 'bg-red';
              return (
                <div key={sub.id} className="panel panel-hover overflow-hidden">
                  <div className="relative h-28 bg-yellowSoft overflow-hidden">
                    <Media url={sub.media} emoji="🏠" alt={`${sub.bhk} BHK`} className="w-full h-full object-cover" emojiClassName="absolute inset-0 flex items-center justify-center text-4xl opacity-70" />
                    <span className={`badge absolute top-2 right-2 capitalize ${sub.status === 'verified' ? 'badge-green' : sub.status === 'rejected' ? 'badge-red' : sub.status === 'rented' ? 'badge-ink' : 'badge-yellow'}`}>{sub.status}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate">{sub.bhk} BHK · {sub.landmark ?? 'Unknown area'}</p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate"><span className="uppercase tracking-wide">Quality{Array.isArray(sub.mediaUrls) && sub.mediaUrls.length > 1 ? ` · ${sub.mediaUrls.length} files` : ''}</span><span className="font-mono font-bold text-ink">{q}/100</span></div>
                    <div className="meter mt-1.5 !h-1.5"><span className={bar} style={{ width: `${q}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
