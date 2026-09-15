'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import AuthGate from '@/components/AuthGate';
import { auth } from '@/lib/firebaseClient';
import { uploadToCloudinary, type UploadedMedia } from '@/lib/cloudinary';
import { compressImage } from '@/lib/compressImage';
import { getCurrentLocation, reverseGeocode, type LatLng } from '@/lib/geo';
import type { User } from 'firebase/auth';
import { MapPinIcon, PlusIcon, PlayIcon, XIcon, CheckIcon, LockIcon, CameraIcon, ShieldCheckIcon, WalletIcon } from '@/components/icons';
import { PROPERTY_TYPES, FACINGS, AGE_BANDS, WATER_SUPPLY, AMENITIES } from '@/lib/listingDetails';

const neighbourhoods = [
  { label: 'HSR Layout', lat: 12.9116, lng: 77.6387 },
  { label: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { label: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { label: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { label: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { label: 'JP Nagar', lat: 12.9078, lng: 77.5858 }
];

export default function ScoutSubmitPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 pt-8 pb-4">
      <p className="section-label mb-2">Scout network</p>
      <h1 className="text-3xl sm:text-4xl">Earn from boards you spot.</h1>
      <p className="text-slate text-lg mt-3">See a TO-LET board on your street? Share it in two minutes and earn every time a renter unlocks it — no brokerage, no follow-ups.</p>

      <div className="grid sm:grid-cols-3 gap-3 mt-7">
        {[
          { Icon: CameraIcon, n: '01', t: 'Submit', b: 'Snap the board — a photo or quick video.' },
          { Icon: ShieldCheckIcon, n: '02', t: 'We verify', b: 'Our team checks it, usually within a day.' },
          { Icon: WalletIcon, n: '03', t: 'You earn', b: 'Up to 50% of every unlock, in your wallet.' }
        ].map(({ Icon, n, t, b }) => (
          <div key={n} className="panel p-4">
            <div className="w-11 h-11 rounded-xl bg-accentSoft text-accent flex items-center justify-center mb-3"><Icon className="w-5 h-5" /></div>
            <div className="flex items-center gap-2"><span className="font-mono text-xs text-slate">{n}</span><h3 className="font-semibold">{t}</h3></div>
            <p className="text-sm text-slate mt-1 leading-snug">{b}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-ink text-paper p-5 mt-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5"><PlayIcon className="w-4 h-4" /></div>
        <div>
          <p className="section-label !text-accent">Higher quality, higher pay</p>
          <p className="text-sm text-paper/80 mt-1.5 max-w-lg">A short video and a confirmed owner lift your trust score — and your pay. A verified listing with 10 unlocks can earn <b className="text-paper">₹150+</b>. <a href="/trust-and-safety" className="underline">How trust works →</a></p>
        </div>
      </div>

      <div className="mt-9 pt-2 border-t border-line">
        <AuthGate>{(user) => (
          <>
            <h2 className="text-xl mt-6 mb-1">Submit a discovery</h2>
            <p className="text-sm text-slate mb-5">Add the board details below — it takes under two minutes.</p>
            <ScoutForm user={user} />
          </>
        )}</AuthGate>
      </div>
    </main>
  );
}

type MediaItem = { file: File; url: string; video: boolean };

function MediaPicker({ items, setItems, max }: { items: MediaItem[]; setItems: Dispatch<SetStateAction<MediaItem[]>>; max: number }) {
  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setItems((prev) => [...prev, ...picked.slice(0, max - prev.length).map((file) => ({ file, url: URL.createObjectURL(file), video: file.type.startsWith('video') }))]);
    e.target.value = '';
  }
  function remove(i: number) {
    setItems((prev) => { URL.revokeObjectURL(prev[i]?.url); return prev.filter((_, x) => x !== i); });
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((m, i) => (
        <div key={m.url} className="relative aspect-square rounded-xl overflow-hidden border border-line bg-canvas">
          {m.video ? <video src={m.url} className="w-full h-full object-cover" muted playsInline /> : <img src={m.url} alt="" className="w-full h-full object-cover" />}
          {m.video && <span className="absolute bottom-1 left-1 badge badge-ink !px-1.5 !py-0.5 text-[9px]"><PlayIcon className="w-2.5 h-2.5" /> video</span>}
          <button type="button" aria-label="Remove" onClick={() => remove(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center"><XIcon className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      {items.length < max && (
        <>
          <label className="aspect-square rounded-xl border-2 border-dashed border-line bg-canvas flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent hover:bg-accentSoft transition-colors">
            <CameraIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">Camera</span>
            {/* capture opens the device camera directly for a fresh photo/video */}
            <input type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={onFiles} />
          </label>
          <label className="aspect-square rounded-xl border-2 border-dashed border-line bg-canvas flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent hover:bg-accentSoft transition-colors">
            <PlusIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold mt-1">Gallery</span>
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFiles} />
          </label>
        </>
      )}
    </div>
  );
}

function ScoutForm({ user }: { user: User }) {
  const [loc, setLoc] = useState<LatLng | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [locating, setLocating] = useState(false);
  const [homeMedia, setHomeMedia] = useState<MediaItem[]>([]);
  const [boardMedia, setBoardMedia] = useState<MediaItem[]>([]);
  const [photoError, setPhotoError] = useState('');
  const MAX_HOME = 8;
  const MAX_BOARD = 3;
  const [bhk, setBhk] = useState(1);
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [furnishing, setFurnishing] = useState('semi furnished');
  const [bachelor, setBachelor] = useState<'yes' | 'no' | 'unknown'>('yes');
  const [contacted, setContacted] = useState<'yes' | 'no' | ''>('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [amenities, setAmenities] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [notes, setNotes] = useState('');
  const setD = (k: string, v: string) => setDetails((d) => ({ ...d, [k]: v }));
  const toggleAmenity = (a: string) => setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function useLocation() {
    setLocating(true);
    try {
      const l = await getCurrentLocation();
      setLoc(l);
      setPlaceName(await reverseGeocode(l));
    } catch {
      alert("Couldn't get your location — please allow location access and try again.");
    } finally {
      setLocating(false);
    }
  }

  function chooseNeighbourhood(value: string) {
    const area = neighbourhoods.find((item) => item.label === value);
    if (!area) return;
    setLoc({ lat: area.lat, lng: area.lng });
    setPlaceName(area.label);
  }

  async function submit() {
    if (!loc) return alert('Please capture your location first.');
    if (!rent) return alert('Please enter the rent.');
    if (!ownerPhone.trim()) return alert('Please add the owner or contact number from the board.');
    if (!contacted) return alert('Please tell us whether you have spoken to the owner.');
    setSubmitting(true);
    setSubmitError('');

    const token = await user.getIdToken();

    // Uploads happen only now (on submit), not on file-select. A failed upload
    // is skipped rather than blocking a legitimate discovery.
    async function uploadAll(list: MediaItem[]) {
      const settled = await Promise.allSettled(list.map(async (m) => uploadToCloudinary(await compressImage(m.file), token)));
      const ok = settled.filter((s): s is PromiseFulfilledResult<UploadedMedia> => s.status === 'fulfilled').map((s) => s.value);
      return { ok, failed: settled.some((s) => s.status === 'rejected') };
    }
    if (homeMedia.length || boardMedia.length) setStage('Optimising & uploading media…');
    const home = await uploadAll(homeMedia);
    const board = await uploadAll(boardMedia);
    if (home.failed || board.failed) setPhotoError('Some files could not be uploaded and were skipped. Your discovery can still be submitted.');
    const uploaded = [...home.ok, ...board.ok];

    setStage('Saving your discovery…');
    const res = await fetch('/api/scout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        lat: loc.lat,
        lng: loc.lng,
        landmark: placeName,
        bhk,
        rent: Number(rent),
        deposit: Number(deposit || 0),
        furnishing,
        bachelorAllowed: bachelor,
        ownerName,
        ownerPhone,
        contactedOwner: contacted,
        availabilityConfirmed,
        notes,
        details,
        amenities,
        mediaUrls: home.ok.map((u) => u.url),
        boardMediaUrls: board.ok.map((u) => u.url)
      })
    });
    setSubmitting(false);
    setStage('');
    if (res.ok) setDone(true);
    else {
      // Submission failed — delete the just-uploaded media so nothing is orphaned.
      if (uploaded.length) {
        void fetch('/api/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ items: uploaded.map((u) => ({ publicId: u.publicId, resourceType: u.resourceType })) })
        }).catch(() => {});
      }
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error ?? 'Something went wrong. Please try again.');
    }
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-greenSoft border-2 border-green flex items-center justify-center text-green"><CheckIcon className="w-7 h-7" /></div>
        <h2 className="text-xl">Thanks! Your discovery is being verified.</h2>
        <p className="text-sm text-slate-500 mt-2">We&apos;ll notify you once it&apos;s live and you can track it in your dashboard.</p>
        <a className="btn btn-primary mt-5" href="/scout/dashboard">View my dashboard →</a>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="text-xs font-bold block mb-1">Photos &amp; videos of the home <span className="font-normal text-slate">(shown publicly)</span></label>
        <MediaPicker items={homeMedia} setItems={setHomeMedia} max={MAX_HOME} />
        <p className="text-[11px] text-slate mt-1">Up to {MAX_HOME}. These appear on the listing for everyone — do not include the owner&apos;s number here.</p>
      </div>

      <div className="sm:col-span-2 rounded-xl border border-line bg-canvas p-3">
        <label className="text-xs font-bold flex items-center gap-1.5 mb-1"><LockIcon className="w-3.5 h-3.5 text-accent" /> Photo / video of the TO-LET board <span className="font-normal text-slate">(hidden until unlock)</span></label>
        <MediaPicker items={boardMedia} setItems={setBoardMedia} max={MAX_BOARD} />
        <p className="text-[11px] text-slate mt-1">The board usually shows the owner&apos;s number — kept private and revealed only to renters who unlock. Strong proof boosts your trust score &amp; reward.</p>
        {photoError && <p className="text-xs text-red mt-1">{photoError}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="text-xs font-bold block mb-1">Location <span className="text-red">*</span></label>
        <button type="button" className="btn btn-sm" onClick={useLocation} disabled={locating}>
          <MapPinIcon className="w-4 h-4" /> {locating ? 'Locating…' : loc ? placeName : 'Use current location'}
        </button>
        <select className="input mt-2" defaultValue="" onChange={(e) => chooseNeighbourhood(e.target.value)}>
          <option value="" disabled>Or choose an approximate neighbourhood</option>
          {neighbourhoods.map((area) => <option key={area.label} value={area.label}>{area.label}</option>)}
        </select>
        <p className="text-[11px] text-slate mt-1">We only show an approximate area until a renter unlocks the contact.</p>
      </div>

      <div className="sm:col-span-2">
        <label className="text-xs font-bold block mb-1">BHK</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setBhk(n)}
              className={`flex-1 border rounded-lg py-2 text-sm font-semibold transition-colors ${bhk === n ? 'bg-ink text-white border-ink' : 'border-line hover:bg-canvas'}`}
            >
              {n}
              {n === 4 ? '+' : ''}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Monthly rent (₹) <span className="text-red">*</span></label>
        <input
          className="input"
          type="number"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Deposit (₹)</label>
        <input
          className="input"
          type="number"
          value={deposit}
          onChange={(e) => setDeposit(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Owner / contact name</label>
        <input
          className="input"
          placeholder="e.g. Ramesh Gowda"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Owner phone <span className="text-red">*</span></label>
        <input
          className="input"
          type="tel"
          placeholder="Number shown on the board"
          value={ownerPhone}
          onChange={(e) => setOwnerPhone(e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 sticker bg-greenSoft p-4">
        <label className="text-xs font-bold block mb-2">Have you spoken to the owner? <span className="text-red">*</span></label>
        <div className="flex gap-2">
          {([['yes', 'Yes, I spoke to them'], ['no', 'No, just saw the board']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => { setContacted(v); if (v === 'no') setAvailabilityConfirmed(false); }}
              className={`flex-1 border rounded-lg py-2 px-2 text-xs font-semibold transition-colors ${contacted === v ? 'bg-green text-white border-green' : 'border-line bg-paper hover:bg-canvas'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {contacted === 'yes' && (
          <label className="flex items-center gap-2 mt-3 text-xs font-bold cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-green" checked={availabilityConfirmed} onChange={(e) => setAvailabilityConfirmed(e.target.checked)} />
            Owner confirmed it&apos;s still available
          </label>
        )}
        <p className="text-[11px] text-slate mt-2">Speaking to the owner and confirming availability boosts your listing&apos;s trust score and your reward.</p>
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Furnishing</label>
        <select
          className="input"
          value={furnishing}
          onChange={(e) => setFurnishing(e.target.value)}
        >
          <option>unfurnished</option>
          <option>semi furnished</option>
          <option>fully furnished</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-bold block mb-1">Bachelor allowed</label>
        <div className="flex gap-2">
          {(['yes', 'no', 'unknown'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setBachelor(v)}
              className={`flex-1 border rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
                bachelor === v ? 'bg-ink text-white border-ink' : 'border-line hover:bg-canvas'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2 rounded-xl border border-line">
        <button type="button" onClick={() => setShowMore((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold">
          <span>More details <span className="font-normal text-slate">(optional — improves your listing &amp; trust)</span></span>
          <span className="text-slate">{showMore ? '▲' : '▼'}</span>
        </button>
        {showMore && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <label className="text-xs font-bold">Property type<select className="input mt-1" value={details.propertyType ?? ''} onChange={(e) => setD('propertyType', e.target.value)}><option value="">Select</option>{PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="text-xs font-bold">Built-up area (sq.ft)<input className="input mt-1" type="number" value={details.areaSqft ?? ''} onChange={(e) => setD('areaSqft', e.target.value)} /></label>
            <label className="text-xs font-bold">Floor<input className="input mt-1" type="number" value={details.floor ?? ''} onChange={(e) => setD('floor', e.target.value)} /></label>
            <label className="text-xs font-bold">Total floors<input className="input mt-1" type="number" value={details.totalFloors ?? ''} onChange={(e) => setD('totalFloors', e.target.value)} /></label>
            <label className="text-xs font-bold">Facing<select className="input mt-1" value={details.facing ?? ''} onChange={(e) => setD('facing', e.target.value)}><option value="">Select</option>{FACINGS.map((f) => <option key={f}>{f}</option>)}</select></label>
            <label className="text-xs font-bold">Age of property<select className="input mt-1" value={details.ageBand ?? ''} onChange={(e) => setD('ageBand', e.target.value)}><option value="">Select</option>{AGE_BANDS.map((a) => <option key={a}>{a}</option>)}</select></label>
            <label className="text-xs font-bold">Bathrooms<input className="input mt-1" type="number" value={details.bathrooms ?? ''} onChange={(e) => setD('bathrooms', e.target.value)} /></label>
            <label className="text-xs font-bold">Balconies<input className="input mt-1" type="number" value={details.balconies ?? ''} onChange={(e) => setD('balconies', e.target.value)} /></label>
            <label className="text-xs font-bold">Maintenance (₹/mo)<input className="input mt-1" type="number" value={details.maintenance ?? ''} onChange={(e) => setD('maintenance', e.target.value)} /></label>
            <label className="text-xs font-bold">Water supply<select className="input mt-1" value={details.waterSupply ?? ''} onChange={(e) => setD('waterSupply', e.target.value)}><option value="">Select</option>{WATER_SUPPLY.map((w) => <option key={w}>{w}</option>)}</select></label>
            <label className="text-xs font-bold col-span-2">Available from<input className="input mt-1" type="date" value={details.availableFrom ?? ''} onChange={(e) => setD('availableFrom', e.target.value)} /></label>
            <div className="col-span-2">
              <p className="text-xs font-bold mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${amenities.includes(a) ? 'bg-ink text-white border-ink' : 'border-line hover:bg-canvas'}`}>{a}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <label className="text-xs font-bold block mb-1">Additional information</label>
        <textarea
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button className="btn btn-primary w-full sm:col-span-2" onClick={submit} disabled={submitting}>
        {submitting ? (stage || 'Submitting…') : 'Submit Rental'}
      </button>
      {submitError && <p className="text-sm text-red text-center sm:col-span-2">{submitError}</p>}
    </div>
  );
}
