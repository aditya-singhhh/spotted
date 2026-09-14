'use client';

import { useEffect, useState, type ReactNode } from 'react';
import AuthGate from '@/components/AuthGate';
import Media from '@/components/Media';
import { auth } from '@/lib/firebaseClient';
import type { User } from 'firebase/auth';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import ShortlistButton from '@/components/ShortlistButton';
import { HomeIcon, MapPinIcon, WalletIcon, TrendingUpIcon, ShieldCheckIcon, SparkleIcon, SearchIcon } from '@/components/icons';
import { readCache, writeCache, readRecentlyViewed, type RecentItem } from '@/lib/clientCache';

export default function ProfilePage() {
  const [mode, setMode] = useState<'tenant' | 'scout'>('tenant');
  useEffect(() => { const m = readCache<'tenant' | 'scout'>('profile:mode'); if (m === 'tenant' || m === 'scout') setMode(m); }, []);
  function pick(m: 'tenant' | 'scout') { setMode(m); writeCache('profile:mode', m); }
  const toggle = (
    <div className="inline-flex border border-line rounded-lg overflow-hidden text-sm font-medium shrink-0">
      <button type="button" aria-pressed={mode === 'tenant'} onClick={() => pick('tenant')} className={`flex items-center gap-1.5 px-3 py-1.5 ${mode === 'tenant' ? 'bg-ink text-white' : 'bg-paper hover:bg-canvas'}`}><HomeIcon className="w-4 h-4" /> Tenant</button>
      <button type="button" aria-pressed={mode === 'scout'} onClick={() => pick('scout')} className={`px-3 py-1.5 border-l border-line ${mode === 'scout' ? 'bg-ink text-white' : 'bg-paper hover:bg-canvas'}`}>Scout</button>
    </div>
  );
  return (
    <main className="max-w-5xl mx-auto px-5">
      <TopBar eyebrow="Your account" title="Profile" action={toggle} />
      <AuthGate>{(user) => (
        <>
          <ProfileHeader user={user} mode={mode} />
          {mode === 'scout' ? <Stats user={user} /> : <TenantView user={user} />}
        </>
      )}</AuthGate>
    </main>
  );
}

function ProfileHeader({ user, mode }: { user: User; mode: 'tenant' | 'scout' }) {
  const initial = (user.email || user.phoneNumber || 'U').charAt(0).toUpperCase();
  const since = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;
  return (
    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-line animate-fade-up">
      <div className="w-14 h-14 rounded-full bg-accentSoft text-accent flex items-center justify-center font-display text-xl font-bold shrink-0">{initial}</div>
      <div className="min-w-0">
        <p className="font-semibold text-lg leading-tight truncate">{user.email ?? user.phoneNumber ?? 'Your account'}</p>
        <p className="text-xs text-slate mt-1 flex items-center gap-2">
          <span className={`badge ${mode === 'scout' ? 'badge-accent' : 'badge-green'}`}>{mode === 'scout' ? 'Scout' : 'Tenant'} mode</span>
          {since && <span>Member since {since}</span>}
        </p>
      </div>
    </div>
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
  const [saved, setSaved] = useState<any[] | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    setRecent(readRecentlyViewed());
    (async () => {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [u, s, ss] = await Promise.all([
        fetch('/api/tenant/unlocks', { headers }).then((r) => r.json()).catch(() => ({ unlocks: [] })),
        fetch('/api/shortlist', { headers }).then((r) => r.json()).catch(() => ({ listings: [] })),
        fetch('/api/saved-searches', { headers }).then((r) => r.json()).catch(() => ({ searches: [] }))
      ]);
      setUnlocks(u.unlocks ?? []);
      setShortlist(s.listings ?? []);
      setSaved(ss.searches ?? []);
    })();
  }, [user]);

  async function removeSaved(id: string) {
    setSaved((prev) => (prev ?? []).filter((x) => x.id !== id));
    const token = await user.getIdToken();
    fetch('/api/saved-searches', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) }).catch(() => {});
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {recent.length > 0 && (
        <section>
          <SectionHead title="Recently viewed" count={recent.length} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((r) => (
              <Link key={r.id} href={`/listing/${r.id}`} className="panel panel-hover overflow-hidden">
                <div className="relative h-24 bg-accentSoft overflow-hidden"><Media url={r.media} className="w-full h-full object-cover" emojiClassName="" /></div>
                <div className="p-3"><p className="font-semibold text-sm">{r.bhk} BHK · {inr(r.rent)}</p><p className="text-xs text-slate mt-0.5 truncate">{r.landmark}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {saved && saved.length > 0 && (
        <section>
          <SectionHead title="Saved searches" count={saved.length} />
          <div className="flex flex-wrap gap-2">
            {saved.map((ss) => (
              <div key={ss.id} className="inline-flex items-center gap-2 panel px-3 py-2 text-sm">
                <Link href={`/discover${ss.query ? `?${ss.query}` : ''}`} className="font-medium hover:text-accent flex items-center gap-1.5"><SearchIcon className="w-3.5 h-3.5 text-slate" /> {ss.name}</Link>
                <button onClick={() => removeSaved(ss.id)} aria-label="Remove" className="text-slate hover:text-ink">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}

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

const MIN_WITHDRAWAL = 100;

function Stats({ user }: { user: User }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [wErr, setWErr] = useState('');
  const [wBusy, setWBusy] = useState(false);

  async function load() {
    const token = await user.getIdToken();
    try {
      const res = await fetch('/api/scout/stats', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(7000) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not load your dashboard.');
      setData(body);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load your dashboard.'); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user]);

  if (!data) return <div className="panel p-6"><p className="font-semibold">{error ? 'Your dashboard is temporarily unavailable.' : 'Loading your dashboard…'}</p>{error && <p className="text-sm text-slate mt-1">Please check your connection and refresh.</p>}</div>;

  const s = data.scout;
  const trust = Math.max(0, Math.min(100, Number(s.trustScore ?? 0)));
  const available = Number(s.availableEarnings ?? 0);
  const withdrawals: any[] = data.withdrawals ?? [];

  async function requestWithdraw() {
    setWErr('');
    const amt = Number(amount);
    if (!method.trim()) return setWErr('Enter your UPI ID or bank account details.');
    if (!(amt >= MIN_WITHDRAWAL)) return setWErr(`Minimum withdrawal is ₹${MIN_WITHDRAWAL}.`);
    if (amt > available) return setWErr('Amount exceeds your available balance.');
    setWBusy(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/scout/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: amt, method: { type: method.includes('@') ? 'upi' : 'bank', value: method.trim() } }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setWErr(d.error || 'Could not submit your withdrawal.'); return; }
      setShowWithdraw(false); setAmount(''); setMethod('');
      await load();
    } finally { setWBusy(false); }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="rounded-2xl bg-ink text-paper p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-paper/60"><WalletIcon className="w-4 h-4" /><span className="section-label !text-paper/60">Available to withdraw</span></div>
            <p className="font-display text-4xl sm:text-5xl mt-2 leading-none">{inr(available)}</p>
          </div>
          <button className="btn btn-sm bg-paper text-ink border-paper disabled:opacity-40" disabled={available < MIN_WITHDRAWAL} onClick={() => setShowWithdraw((v) => !v)}>Withdraw</button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-paper/15">
          <div><p className="text-[11px] uppercase tracking-wide text-paper/50">Pending</p><p className="font-mono text-lg font-bold mt-1">{inr(s.pendingEarnings)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-paper/50">Total earned</p><p className="font-mono text-lg font-bold mt-1">{inr(s.totalEarned)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-paper/50">Withdrawn</p><p className="font-mono text-lg font-bold mt-1">{inr(s.withdrawnEarnings)}</p></div>
        </div>
        {available < MIN_WITHDRAWAL && <p className="text-[11px] text-paper/50 mt-3">Withdraw once your available balance reaches ₹{MIN_WITHDRAWAL}.</p>}
      </div>

      {showWithdraw && (
        <div className="panel p-4 sm:p-5">
          <h3 className="font-semibold mb-3">Withdraw earnings</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold">Amount (₹)<input className="input mt-1" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Up to ${available}`} /></label>
            <label className="text-xs font-bold">UPI ID or bank account<input className="input mt-1" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="name@upi or A/C + IFSC" /></label>
          </div>
          {wErr && <p className="text-xs text-red mt-2">{wErr}</p>}
          <div className="flex gap-2 mt-3">
            <button className="btn btn-sm btn-primary" onClick={requestWithdraw} disabled={wBusy}>{wBusy ? 'Submitting…' : 'Request payout'}</button>
            <button className="btn btn-sm" onClick={() => setShowWithdraw(false)}>Cancel</button>
          </div>
          <p className="text-[11px] text-slate mt-2">Payouts are reviewed and settled by our team, usually within a few days.</p>
        </div>
      )}

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
                  <div className="relative h-28 bg-canvas overflow-hidden">
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

      {withdrawals.length > 0 && (
        <section>
          <SectionHead title="Payout history" count={withdrawals.length} />
          <div className="panel divide-y divide-line">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div>
                  <p className="font-mono font-bold">{inr(w.amount)}</p>
                  <p className="text-xs text-slate mt-0.5">{w.method?.value} · {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN') : ''}</p>
                </div>
                <span className={`badge capitalize ${w.status === 'paid' ? 'badge-green' : w.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>{w.status === 'requested' ? 'processing' : w.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
