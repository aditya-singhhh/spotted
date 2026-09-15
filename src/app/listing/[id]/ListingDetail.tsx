'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AuthGate from '@/components/AuthGate';
import Media from '@/components/Media';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckIcon, UnlockIcon, MapPinIcon, ShieldCheckIcon, ChevronRightIcon, StarIcon, XIcon } from '@/components/icons';
import ShortlistButton from '@/components/ShortlistButton';
import { pushRecentlyViewed } from '@/lib/clientCache';
import { detailRows } from '@/lib/listingDetails';
import { normalizeEntitlement, resolveUnlockMethod, hasActivePass, type Plan, type Entitlement, EMPTY_ENTITLEMENT } from '@/lib/plans';

const ApproxMap = dynamic(() => import('@/components/ApproxMap'), { ssr: false, loading: () => <div className="w-full h-48 rounded-xl bg-canvas border border-line animate-pulse" /> });

type AreaCard = { slug: string; name: string; rating: number; tagline: string } | null;

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <p className="section-label">{label}</p>
      <p className="font-semibold mt-1 capitalize text-sm">{value}</p>
    </div>
  );
}

export default function ListingDetail({ id, initial, similar = [], area = null }: { id: string; initial: any; similar?: any[]; area?: AreaCard }) {
  const [listing] = useState<any>(initial);
  const [unlocked, setUnlocked] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(29);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement>(EMPTY_ENTITLEMENT);
  const [buying, setBuying] = useState<string | null>(null);
  const [showPacks, setShowPacks] = useState(false);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then((d) => { setUnlockPrice(d.unlockPrice || 29); setPlans(Array.isArray(d.plans) ? d.plans : []); }).catch(() => {});
    pushRecentlyViewed({ id, bhk: listing.bhk, rent: listing.rent, landmark: listing.landmark, media: listing.media });
  }, [id, listing]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        const token = await u.getIdToken();
        const [uRes, eRes] = await Promise.all([
          fetch(`/api/unlock?rentalOpportunityId=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/purchase', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (uRes.ok) { const d = await uRes.json(); if (d.unlocked) setUnlocked(d); }
        if (eRes.ok) setEntitlement(normalizeEntitlement(await eRes.json()));
      } catch { /* stays locked */ }
    });
    return () => unsub();
  }, [id]);

  async function buyPlan(planId: string) {
    setBuying(planId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ planId }) });
      const data = await res.json();
      if (res.ok) { setEntitlement(normalizeEntitlement(data.entitlement)); setShowPacks(false); }
      else alert(data.error ?? 'Could not complete the purchase.');
    } catch { alert('Could not complete the purchase. Please try again.'); } finally { setBuying(null); }
  }

  async function unlock() {
    setUnlocking(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rentalOpportunityId: id }) });
      const data = await res.json();
      if (res.ok) setUnlocked(data); else alert(data.error ?? 'Something went wrong');
    } catch { alert('Could not unlock this listing. Please try again.'); } finally { setUnlocking(false); }
  }

  async function reportListing(reason: string) {
    setReportBusy(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/listing-report', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rentalOpportunityId: id, reason }) });
      if (res.ok) { setReportDone(true); setReportOpen(false); }
    } catch { /* ignore */ } finally { setReportBusy(false); }
  }

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = `${listing.bhk} BHK near ${listing.landmark} · ₹${Number(listing.rent).toLocaleString('en-IN')}/mo`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch { /* user dismissed */ }
  }

  const gallery: string[] = Array.isArray(listing.mediaUrls) && listing.mediaUrls.length ? listing.mediaUrls : listing.media ? [listing.media] : [];
  const active = activeMedia ?? listing.media;
  const rows = detailRows(listing.details);
  const amenities: string[] = Array.isArray(listing.amenities) ? listing.amenities : [];
  const d = listing.details ?? {};
  const highlights: string[] = [
    listing.furnishing ? String(listing.furnishing) : '',
    listing.bachelorAllowed === 'yes' ? 'Bachelors welcome' : listing.bachelorAllowed === 'no' ? 'Family home' : '',
    d.floor != null && d.totalFloors != null ? `Floor ${d.floor}/${d.totalFloors}` : d.floor != null ? `Floor ${d.floor}` : '',
    d.facing ? `${d.facing}-facing` : '',
    d.propertyType ? String(d.propertyType) : '',
    d.availableFrom ? `Available ${d.availableFrom}` : ''
  ].filter(Boolean);
  const spottedDays = listing.spottedAt ? Math.floor((Date.now() - new Date(listing.spottedAt).getTime()) / 86400000) : null;
  const freshText = spottedDays == null ? 'Recently spotted' : spottedDays <= 0 ? 'Spotted today' : spottedDays === 1 ? 'Spotted yesterday' : spottedDays < 30 ? `Spotted ${spottedDays} days ago` : `Spotted ${Math.floor(spottedDays / 30)}mo ago`;

  return (
    <main className="max-w-5xl mx-auto px-5 pt-5 pb-28 lg:pb-12">
      <div className="flex items-center justify-between gap-3">
        <nav className="text-xs text-slate flex items-center gap-1.5 min-w-0" aria-label="Breadcrumb">
          <Link href="/discover" className="hover:text-ink">Discover</Link>
          {area && <><ChevronRightIcon className="w-3.5 h-3.5 shrink-0" /><Link href={`/areas/${area.slug}`} className="hover:text-ink truncate">{area.name}</Link></>}
          <ChevronRightIcon className="w-3.5 h-3.5 shrink-0" /><span className="text-ink font-medium truncate">{listing.bhk} BHK</span>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={share} className="btn btn-sm" aria-label="Share">{shared ? 'Copied!' : 'Share'}</button>
          <ShortlistButton id={id} showLabel className="btn btn-sm" />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-6 mt-4 items-start">
        <div className="animate-fade-up space-y-6">
          <div className="sticker overflow-hidden">
            <button type="button" onClick={() => setLightbox(Math.max(0, gallery.indexOf(active)))} className="relative aspect-[16/10] w-full bg-canvas flex items-center justify-center overflow-hidden group" aria-label="Open photo">
              <Media url={active} emoji={listing.photo || '🏠'} alt={`${listing.bhk} BHK in ${listing.landmark}`} className="w-full h-full object-cover" emojiClassName="text-8xl" />
              {gallery.length > 1 && <span className="absolute bottom-3 right-3 text-xs font-semibold bg-ink/75 text-white px-2.5 py-1 rounded-full">📷 {gallery.length} photos</span>}
            </button>
            {gallery.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-t border-line">
                {gallery.map((u) => (
                  <button key={u} type="button" aria-label="View media" onClick={() => setActiveMedia(u)} className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${active === u ? 'border-accent' : 'border-line'}`}>
                    <Media url={u} className="w-full h-full object-cover" emojiClassName="flex items-center justify-center w-full h-full text-2xl" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex gap-2 flex-wrap mb-3">
              <span className={`badge ${listing.status === 'verified' ? 'badge-green' : 'badge-yellow'}`}>{listing.status === 'verified' ? <><CheckIcon className="w-3.5 h-3.5" /> Owner verified</> : 'Community reported'}</span>
              <Link href="/trust-and-safety" title="How the trust score works" className="badge badge-accent hover:brightness-95"><ShieldCheckIcon className="w-3.5 h-3.5" /> Trust {listing.trustScore}/100</Link>
            </div>
            <h1 className="text-2xl sm:text-3xl">{listing.bhk} BHK near {listing.landmark}</h1>
            <p className="text-slate mt-2 leading-relaxed">{listing.note || 'Spotted on the street by a scout in your neighbourhood — a fresh, real rental you won’t find on the usual portals. Check the details below and connect with the owner directly.'}</p>
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {highlights.map((h) => <span key={h} className="badge bg-canvas border border-line capitalize">{h}</span>)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Fact label="Size" value={`${listing.bhk} BHK`} />
            <Fact label="Deposit" value={`₹${Number(listing.deposit).toLocaleString('en-IN')}`} />
            <Fact label="Furnishing" value={listing.furnishing || 'Unfurnished'} />
            <Fact label="Who can rent" value={listing.bachelorAllowed === 'yes' ? 'Bachelors OK' : listing.bachelorAllowed === 'no' ? 'Families only' : 'Ask the owner'} />
          </div>

          {rows.length > 0 && (
            <div>
              <h2 className="text-lg mb-2">Property details</h2>
              <div className="panel divide-y divide-line">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="text-slate">{k}</span><span className="font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {amenities.length > 0 && (
            <div>
              <h2 className="text-lg mb-2">Amenities</h2>
              <div className="panel p-4 grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
                {amenities.map((a: string) => (
                  <span key={a} className="flex items-center gap-2 text-sm"><CheckIcon className="w-4 h-4 text-green shrink-0" /> {a}</span>
                ))}
              </div>
            </div>
          )}

          <div className="panel p-4">
            <p className="section-label">Location {unlocked ? '' : 'protected'}</p>
            <p className="text-sm mt-1.5 flex items-center gap-1.5 font-medium"><MapPinIcon className="w-4 h-4 shrink-0 text-slate" /> {unlocked?.location?.address || `Approx. area: ${listing.landmark}`}</p>
            {!unlocked && <p className="text-xs text-slate mt-1 mb-3">The exact address and pin appear only after you unlock the owner contact.</p>}
            {typeof listing.approxLat === 'number' && typeof listing.approxLng === 'number' && !unlocked && (
              <div className="mt-2"><ApproxMap lat={listing.approxLat} lng={listing.approxLng} /></div>
            )}
          </div>

          {area && (
            <Link href={`/areas/${area.slug}`} className="panel panel-hover p-4 flex items-center gap-4 group">
              <div className="min-w-0 flex-1">
                <p className="section-label mb-1">About the area</p>
                <p className="font-semibold flex items-center gap-1.5">{area.name} <span className="inline-flex items-center gap-0.5 text-xs text-slate font-normal"><StarIcon className="w-3 h-3 text-yellow" /> {area.rating.toFixed(1)}</span></p>
                <p className="text-xs text-slate mt-0.5 line-clamp-2">{area.tagline}</p>
              </div>
              <span className="text-sm font-semibold text-accent shrink-0 flex items-center gap-1">Guide <ChevronRightIcon className="w-4 h-4" /></span>
            </Link>
          )}

          <div className="flex items-start gap-2.5 text-sm text-slate">
            <ShieldCheckIcon className="w-5 h-5 shrink-0 text-green mt-0.5" />
            <p>Always confirm availability and terms with the owner directly, and never pay a deposit before viewing the home in person.</p>
          </div>
        </div>

        <aside id="unlock" className="lg:sticky lg:top-20 space-y-3 scroll-mt-20">
          <div className="sticker p-5">
            <p className="font-mono text-3xl font-bold">₹{listing.rent.toLocaleString('en-IN')}<span className="text-sm font-normal text-slate"> / month</span></p>
            <div className="divide-y divide-line mt-4 border-t border-line">
              {[['Monthly rent', `₹${listing.rent.toLocaleString('en-IN')}`], ['Security deposit', `₹${Number(listing.deposit).toLocaleString('en-IN')}`], ['Furnishing', listing.furnishing || 'Unfurnished']].map(([a, b]) => (
                <div className="flex justify-between py-2.5 text-sm" key={a}><span className="text-slate">{a}</span><b className="capitalize">{b}</b></div>
              ))}
            </div>

            <div className="mt-4">
              {!unlocked ? (
                <>
                  {(() => {
                    const passActive = hasActivePass(entitlement);
                    const method = resolveUnlockMethod(entitlement);
                    const ctaLabel = unlocking
                      ? 'Unlocking…'
                      : method === 'pass'
                        ? 'Unlock now · Pass active'
                        : method === 'credit'
                          ? `Unlock now · use 1 credit`
                          : `Unlock now · ₹${unlockPrice}`;
                    const packs = plans.filter((p) => p.active !== false);
                    return (
                      <>
                        <div className="rounded-xl border border-line bg-canvas p-3 mb-3">
                          <div className="flex items-baseline justify-between">
                            <span className="font-semibold text-sm">Unlock owner contact</span>
                            {passActive ? (
                              <span className="badge badge-green"><UnlockIcon className="w-3.5 h-3.5" /> Unlimited</span>
                            ) : entitlement.credits > 0 ? (
                              <span className="badge badge-accent">{entitlement.credits} credit{entitlement.credits === 1 ? '' : 's'}</span>
                            ) : (
                              <span className="font-mono font-bold text-accent">₹{unlockPrice}</span>
                            )}
                          </div>
                          <ul className="text-xs text-slate mt-2 space-y-1">
                            <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Owner name &amp; phone number</li>
                            <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Exact location + Google Maps</li>
                            <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Kept in your profile — no re-charge</li>
                          </ul>
                          {passActive && entitlement.passExpiresAt && (
                            <p className="text-[11px] text-slate mt-2">Pass valid till {new Date(entitlement.passExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.</p>
                          )}
                        </div>
                        <AuthGate>{() => (
                          <>
                            <button className="btn btn-primary w-full" onClick={unlock} disabled={unlocking}>{ctaLabel}</button>
                            {method === 'single'
                              ? <p className="text-xs text-slate mt-2 text-center">One-time fee · no brokerage · no subscription.</p>
                              : <p className="text-xs text-slate mt-2 text-center">Included in your {method === 'pass' ? 'pass' : 'pack'} · no extra charge.</p>}

                            {!passActive && packs.length > 0 && (
                              <div className="mt-3">
                                <button type="button" onClick={() => setShowPacks((v) => !v)} className="text-xs font-semibold text-accent w-full text-center">
                                  {showPacks ? 'Hide packs' : `Searching for a few? Save with a pack ↓`}
                                </button>
                                {showPacks && (
                                  <div className="grid gap-2 mt-2">
                                    {packs.map((p) => (
                                      <button key={p.id} type="button" onClick={() => buyPlan(p.id)} disabled={!!buying} className="rounded-xl border border-line bg-paper p-3 text-left hover:border-accent transition-colors disabled:opacity-60">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-semibold text-sm flex items-center gap-1.5">{p.label}{p.badge && <span className="badge badge-accent">{p.badge}</span>}</span>
                                          <span className="font-mono font-bold">₹{p.price}</span>
                                        </div>
                                        <p className="text-xs text-slate mt-0.5">
                                          {p.type === 'pass' ? `Unlimited unlocks for ${p.days} days` : `${p.credits} unlocks`}
                                          {p.type === 'credits' && p.credits ? ` · ₹${Math.round(p.price / p.credits)} each` : ''}
                                          {buying === p.id ? ' · processing…' : ''}
                                        </p>
                                      </button>
                                    ))}
                                    <p className="text-[11px] text-slate text-center">Payments are in demo mode until the gateway is live.</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}</AuthGate>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="rounded-xl bg-greenSoft border border-green/20 p-4">
                  <span className="badge badge-green"><UnlockIcon className="w-3.5 h-3.5" /> Unlocked</span>
                  <h3 className="text-lg mt-3">{unlocked.owner.name || 'Owner'}</h3>
                  {unlocked.owner.phone && <a className="font-mono underline text-sm" href={`tel:${unlocked.owner.phone}`}>{unlocked.owner.phone}</a>}
                  <p className="text-sm mt-3 flex items-center gap-1.5"><MapPinIcon className="w-4 h-4 shrink-0 text-slate" /> {unlocked.location.address || 'Exact location unlocked'}</p>
                  {typeof unlocked.location.lat === 'number' && typeof unlocked.location.lng === 'number' && (
                    <a className="btn btn-sm btn-dark w-full mt-3" href={`https://www.google.com/maps/search/?api=1&query=${unlocked.location.lat},${unlocked.location.lng}`} target="_blank" rel="noopener noreferrer"><MapPinIcon className="w-4 h-4" /> Open in Google Maps</a>
                  )}
                  {Array.isArray(unlocked.board) && unlocked.board.length > 0 && (
                    <div className="mt-4">
                      <p className="section-label mb-2">TO‑LET board proof</p>
                      <div className="grid grid-cols-3 gap-2">
                        {unlocked.board.map((u: string) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-line bg-canvas block">
                            <Media url={u} className="w-full h-full object-cover" emojiClassName="flex items-center justify-center w-full h-full" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-green/20">
                    {reportDone ? (
                      <p className="text-xs text-slate flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Thanks — we’ll review this listing.</p>
                    ) : !reportOpen ? (
                      <button type="button" onClick={() => setReportOpen(true)} className="text-xs font-semibold text-slate underline hover:text-ink">Something wrong? Report this listing</button>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold mb-2">What went wrong?</p>
                        <div className="grid gap-1.5">
                          {([['rented', 'Already rented'], ['unreachable', 'Couldn’t reach the owner'], ['wrong_info', 'Details were wrong'], ['other', 'Something else']] as [string, string][]).map(([r, label]) => (
                            <button key={r} type="button" disabled={reportBusy} onClick={() => reportListing(r)} className="text-left text-xs rounded-lg border border-line bg-paper px-3 py-2 hover:border-accent disabled:opacity-60">{label}</button>
                          ))}
                        </div>
                        <button type="button" onClick={() => setReportOpen(false)} className="text-[11px] text-slate mt-2 underline">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-[11px] text-slate">{freshText} · <a href={`mailto:hello@spotted.app?subject=Report listing ${id}`} className="underline hover:text-ink">report a problem</a></p>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl sm:text-2xl">More homes {area ? `in ${area.name}` : 'like this'}</h2>
            <Link href={area ? `/discover?query=${encodeURIComponent(area.name)}` : '/discover'} className="text-sm font-semibold text-accent shrink-0">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((l) => (
              <Link key={l.id} href={`/listing/${l.id}`} className="panel panel-hover overflow-hidden group">
                <div className="relative aspect-[16/11] bg-canvas overflow-hidden">
                  <Media url={l.media} emoji="🏠" alt={`${l.bhk} BHK in ${l.landmark}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" emojiClassName="flex items-center justify-center w-full h-full text-4xl" />
                  <span className={`badge absolute top-2 right-2 ${l.status === 'verified' ? 'badge-green' : 'badge-yellow'}`}>{l.status === 'verified' ? 'Verified' : 'Community'}</span>
                </div>
                <div className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{l.bhk} BHK</span>
                    <span className="font-mono font-bold">₹{Number(l.rent).toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-xs text-slate mt-1 flex items-center gap-1 truncate"><MapPinIcon className="w-3.5 h-3.5 shrink-0" /> {l.landmark}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile unlock bar */}
      {!unlocked && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur border-t border-line px-4 py-3 flex items-center justify-between gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div>
            <p className="font-mono text-lg font-bold leading-none">₹{listing.rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate">/mo</span></p>
            <p className="text-[11px] text-slate mt-0.5">{hasActivePass(entitlement) ? 'Unlimited pass active' : entitlement.credits > 0 ? `${entitlement.credits} credits left` : 'Unlock owner contact'}</p>
          </div>
          <a href="#unlock" className="btn btn-primary shrink-0"><UnlockIcon className="w-4 h-4" /> Unlock</a>
        </div>
      )}

      {/* Fullscreen gallery lightbox */}
      {lightbox !== null && gallery.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-ink/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button aria-label="Close" className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={() => setLightbox(null)}><XIcon className="w-7 h-7" /></button>
          <button aria-label="Previous" className="absolute left-3 sm:left-6 text-white/70 hover:text-white text-4xl px-2" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? 0 : (i - 1 + gallery.length) % gallery.length)); }}>‹</button>
          <div className="max-w-4xl max-h-[85vh] w-full px-4" onClick={(e) => e.stopPropagation()}>
            <Media url={gallery[lightbox]} className="w-full max-h-[85vh] object-contain" emojiClassName="flex items-center justify-center w-full h-64 text-6xl" />
            <p className="text-center text-white/60 text-xs mt-3">{lightbox + 1} / {gallery.length}</p>
          </div>
          <button aria-label="Next" className="absolute right-3 sm:right-6 text-white/70 hover:text-white text-4xl px-2" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i === null ? 0 : (i + 1) % gallery.length)); }}>›</button>
        </div>
      )}
    </main>
  );
}
