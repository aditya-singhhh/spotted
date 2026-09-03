'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import Media from '@/components/Media';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { CheckIcon, UnlockIcon, MapPinIcon } from '@/components/icons';
import ShortlistButton from '@/components/ShortlistButton';

export default function ListingDetail({ id, initial }: { id: string; initial: any }) {
  const [listing] = useState<any>(initial);
  const [unlocked, setUnlocked] = useState<any>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState(29);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => setUnlockPrice(d.unlockPrice || 29)).catch(() => {});
  }, []);

  // Restore a previous paid unlock so it persists across refreshes (no recharge).
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

  const details = [['Monthly rent', `₹${listing.rent.toLocaleString('en-IN')}`], ['Security deposit', `₹${listing.deposit.toLocaleString('en-IN')}`], ['Furnishing', listing.furnishing], ['Who can rent', listing.bachelorAllowed === 'yes' ? 'Bachelor friendly' : 'Families preferred']];

  return <main className="max-w-4xl mx-auto px-5 pt-6"><div className="flex items-center justify-between gap-3"><Link href="/discover" className="text-sm font-bold underline">← All discoveries</Link><ShortlistButton id={id} showLabel className="btn btn-sm" /></div><div className="grid md:grid-cols-[1.2fr_.8fr] gap-5 mt-5 animate-fade-up"><div><div className="sticker overflow-hidden"><div className="relative h-52 sm:h-72 lg:h-80 bg-yellowSoft flex items-center justify-center border-b-2 border-ink overflow-hidden"><Media url={activeMedia ?? listing.media} emoji={listing.photo || '🏠'} alt={`${listing.bhk} BHK in ${listing.landmark}`} className="w-full h-full object-cover" emojiClassName="text-8xl" /></div>{Array.isArray(listing.mediaUrls) && listing.mediaUrls.length > 1 && <div className="flex gap-2 p-3 overflow-x-auto border-b-2 border-ink">{listing.mediaUrls.map((u: string) => <button key={u} type="button" aria-label="View media" onClick={() => setActiveMedia(u)} className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${(activeMedia ?? listing.media) === u ? 'border-pink' : 'border-ink'}`}><Media url={u} className="w-full h-full object-cover" emojiClassName="flex items-center justify-center w-full h-full text-2xl" /></button>)}</div>}<div className="p-5"><div className="flex gap-2 flex-wrap"><span className={`badge ${listing.status === 'verified' ? 'badge-green' : 'badge-yellow'}`}>{listing.status === 'verified' ? <><CheckIcon className="w-3.5 h-3.5" /> Owner verified</> : '● Community reported'}</span><span className="badge badge-ink">Trust {listing.trustScore}/100</span></div><h1 className="text-3xl mt-4">{listing.bhk} BHK near {listing.landmark}</h1><p className="text-sm text-slate mt-2">{listing.note || 'A fresh rental opportunity discovered in your neighbourhood.'}</p><div className="mt-5 border-2 border-dashed border-ink rounded-xl p-3 bg-paper"><p className="section-label">Location protected</p><p className="text-sm mt-1 flex items-center gap-1"><MapPinIcon className="w-4 h-4 shrink-0" /> Approx. area: {listing.landmark}</p><p className="text-xs text-slate mt-1">The exact address appears only after you unlock owner contact.</p></div></div></div></div><aside className="space-y-4"><div className="sticker p-5"><p className="font-mono text-3xl font-bold">₹{listing.rent.toLocaleString('en-IN')}<span className="text-xs font-normal"> / month</span></p><div className="divide-y divide-dashed mt-4">{details.map(([a, b]) => <div className="flex justify-between py-2 text-sm" key={a}><span className="text-slate">{a}</span><b>{b}</b></div>)}</div></div>{!unlocked ? <AuthGate>{() => <div className="sticker p-4 bg-pinkSoft"><p className="font-bold">Ready to talk directly?</p><p className="text-xs text-slate my-2">One unlock connects you with the owner — no brokerage.</p><button className="btn btn-primary w-full" onClick={unlock} disabled={unlocking}>{unlocking ? 'Unlocking…' : `Unlock owner contact · ₹${unlockPrice}`}</button></div>}</AuthGate> : <div className="sticker p-5 bg-greenSoft"><span className="badge badge-green"><UnlockIcon className="w-3.5 h-3.5" /> Unlocked</span><h3 className="text-xl mt-3">{unlocked.owner.name}</h3><a className="font-mono underline" href={`tel:${unlocked.owner.phone}`}>{unlocked.owner.phone}</a><p className="text-sm mt-4 flex items-center gap-1"><MapPinIcon className="w-4 h-4 shrink-0" /> {unlocked.location.address || 'Exact location unlocked'}</p>{typeof unlocked.location.lat === 'number' && typeof unlocked.location.lng === 'number' && <a className="btn btn-sm btn-dark w-full mt-3" href={`https://www.google.com/maps/search/?api=1&query=${unlocked.location.lat},${unlocked.location.lng}`} target="_blank" rel="noopener noreferrer"><MapPinIcon className="w-4 h-4" /> Open in Google Maps</a>}<p className="text-xs text-slate mt-4">Confirm availability and terms directly before paying anything.</p></div>}<p className="text-center font-mono text-[10px] text-slate">{listing.freshness || 'Freshly spotted'} · report stale listing</p></aside></div></main>;
}
