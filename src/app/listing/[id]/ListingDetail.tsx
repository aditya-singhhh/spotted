'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import Media from '@/components/Media';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckIcon, UnlockIcon, MapPinIcon, ShieldCheckIcon } from '@/components/icons';
import ShortlistButton from '@/components/ShortlistButton';
import { pushRecentlyViewed } from '@/lib/clientCache';
import { detailRows } from '@/lib/listingDetails';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <p className="section-label">{label}</p>
      <p className="font-semibold mt-1 capitalize text-sm">{value}</p>
    </div>
  );
}

export default function ListingDetail({ id, initial }: { id: string; initial: any }) {
  const [listing] = useState<any>(initial);
  const [unlocked, setUnlocked] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(29);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setUnlockPrice(d.unlockPrice || 29)).catch(() => {});
    pushRecentlyViewed({ id, bhk: listing.bhk, rent: listing.rent, landmark: listing.landmark, media: listing.media });
  }, [id, listing]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        const token = await u.getIdToken();
        const res = await fetch(`/api/unlock?rentalOpportunityId=${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); if (d.unlocked) setUnlocked(d); }
      } catch { /* stays locked */ }
    });
    return () => unsub();
  }, [id]);

  async function unlock() {
    setUnlocking(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rentalOpportunityId: id }) });
      const data = await res.json();
      if (res.ok) setUnlocked(data); else alert(data.error ?? 'Something went wrong');
    } catch { alert('Could not unlock this listing. Please try again.'); } finally { setUnlocking(false); }
  }

  const gallery: string[] = Array.isArray(listing.mediaUrls) && listing.mediaUrls.length ? listing.mediaUrls : listing.media ? [listing.media] : [];
  const active = activeMedia ?? listing.media;
  const rows = detailRows(listing.details);
  const amenities: string[] = Array.isArray(listing.amenities) ? listing.amenities : [];
  const spottedDays = listing.spottedAt ? Math.floor((Date.now() - new Date(listing.spottedAt).getTime()) / 86400000) : null;
  const freshText = spottedDays == null ? 'Recently spotted' : spottedDays <= 0 ? 'Spotted today' : spottedDays === 1 ? 'Spotted yesterday' : spottedDays < 30 ? `Spotted ${spottedDays} days ago` : `Spotted ${Math.floor(spottedDays / 30)}mo ago`;

  return (
    <main className="max-w-5xl mx-auto px-5 pt-6 pb-12">
      <div className="flex items-center justify-between gap-3">
        <Link href="/discover" className="text-sm font-semibold text-accent">← All discoveries</Link>
        <ShortlistButton id={id} showLabel className="btn btn-sm" />
      </div>

      <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-6 mt-5 items-start">
        <div className="animate-fade-up space-y-6">
          <div className="sticker overflow-hidden">
            <div className="relative aspect-[16/10] bg-canvas flex items-center justify-center overflow-hidden">
              <Media url={active} emoji={listing.photo || '🏠'} alt={`${listing.bhk} BHK in ${listing.landmark}`} className="w-full h-full object-cover" emojiClassName="text-8xl" />
            </div>
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
            <p className="text-slate mt-2 leading-relaxed">{listing.note || 'A fresh rental opportunity discovered on the street in your neighbourhood. Verify the details and connect with the owner directly.'}</p>
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

          <div className="panel p-4 bg-canvas border-dashed">
            <p className="section-label">Location protected</p>
            <p className="text-sm mt-1.5 flex items-center gap-1.5 font-medium"><MapPinIcon className="w-4 h-4 shrink-0 text-slate" /> Approx. area: {listing.landmark}</p>
            <p className="text-xs text-slate mt-1">The exact address and pin appear only after you unlock the owner contact.</p>
          </div>

          <div className="flex items-start gap-2.5 text-sm text-slate">
            <ShieldCheckIcon className="w-5 h-5 shrink-0 text-green mt-0.5" />
            <p>Always confirm availability and terms with the owner directly, and never pay a deposit before viewing the home in person.</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 space-y-3">
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
                  <div className="rounded-xl border border-line bg-canvas p-3 mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-sm">Unlock owner contact</span>
                      <span className="font-mono font-bold text-accent">₹{unlockPrice}</span>
                    </div>
                    <ul className="text-xs text-slate mt-2 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Owner name &amp; phone number</li>
                      <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Exact location + Google Maps</li>
                      <li className="flex items-center gap-1.5"><CheckIcon className="w-3.5 h-3.5 text-green shrink-0" /> Kept in your profile — no re-charge</li>
                    </ul>
                  </div>
                  <AuthGate>{() => (
                    <>
                      <button className="btn btn-primary w-full" onClick={unlock} disabled={unlocking}>{unlocking ? 'Unlocking…' : `Unlock now · ₹${unlockPrice}`}</button>
                      <p className="text-xs text-slate mt-2 text-center">One-time fee · no brokerage · no subscription.</p>
                    </>
                  )}</AuthGate>
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
                </div>
              )}
            </div>
          </div>
          <p className="text-center text-[11px] text-slate">{freshText} · <a href={`mailto:hello@spotted.app?subject=Report listing ${id}`} className="underline hover:text-ink">report a problem</a></p>
        </aside>
      </div>
    </main>
  );
}
