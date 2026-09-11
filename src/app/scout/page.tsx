'use client';

import { useState } from 'react';
import AuthGate from '@/components/AuthGate';
import { auth } from '@/lib/firebaseClient';
import { uploadToCloudinary, type UploadedMedia } from '@/lib/cloudinary';
import { compressImage } from '@/lib/compressImage';
import { getCurrentLocation, reverseGeocode, type LatLng } from '@/lib/geo';
import type { User } from 'firebase/auth';
import TopBar from '@/components/TopBar';
import { MapPinIcon, PlusIcon, PlayIcon, XIcon, CheckIcon } from '@/components/icons';

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
    <main className="max-w-3xl mx-auto px-5">
      <TopBar eyebrow="Scout network" title="Submit a rental" />
      <div className="sticker bg-accentSoft p-4 mb-5">
        <p className="font-bold">Anyone can become a Scout.</p>
        <p className="text-sm text-slate mt-1">Sign in, share a genuine TO-LET discovery, and earn when a renter unlocks it. Our team reviews every listing before it goes live.</p>
      </div>
      <AuthGate>{(user) => <ScoutForm user={user} />}</AuthGate>
    </main>
  );
}

function ScoutForm({ user }: { user: User }) {
  const [loc, setLoc] = useState<LatLng | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [locating, setLocating] = useState(false);
  const [media, setMedia] = useState<{ file: File; url: string; video: boolean }[]>([]);
  const [photoError, setPhotoError] = useState('');
  const MAX_MEDIA = 6;
  const [bhk, setBhk] = useState(1);
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [furnishing, setFurnishing] = useState('semi furnished');
  const [bachelor, setBachelor] = useState<'yes' | 'no' | 'unknown'>('yes');
  const [contacted, setContacted] = useState<'yes' | 'no' | ''>('');
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(false);
  const [notes, setNotes] = useState('');
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

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setPhotoError('');
    setMedia((prev) => [
      ...prev,
      ...picked.slice(0, MAX_MEDIA - prev.length).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        video: file.type.startsWith('video')
      }))
    ]);
    e.target.value = '';
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index]?.url);
      return prev.filter((_, i) => i !== index);
    });
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
    if (media.length) setStage('Optimising & uploading media…');
    const settled = await Promise.allSettled(media.map(async (m) => uploadToCloudinary(await compressImage(m.file), token)));
    const uploaded = settled.filter((s): s is PromiseFulfilledResult<UploadedMedia> => s.status === 'fulfilled').map((s) => s.value);
    if (settled.some((s) => s.status === 'rejected')) {
      setPhotoError('Some files could not be uploaded and were skipped. Your discovery can still be submitted.');
    }

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
        mediaUrls: uploaded.map((u) => u.url)
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
        <label className="text-xs font-bold block mb-1">Photos &amp; videos of the TO-LET board</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {media.map((m, i) => (
            <div key={m.url} className="relative aspect-square rounded-xl overflow-hidden border border-line bg-canvas">
              {m.video
                ? <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                : <img src={m.url} alt="" className="w-full h-full object-cover" />}
              {m.video && <span className="absolute bottom-1 left-1 badge badge-ink !px-1.5 !py-0.5 text-[9px]"><PlayIcon className="w-2.5 h-2.5" /> video</span>}
              <button type="button" aria-label="Remove" onClick={() => removeMedia(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center"><XIcon className="w-3.5 h-3.5" /></button>
            </div>
          ))}
          {media.length < MAX_MEDIA && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-line bg-canvas flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent hover:bg-accentSoft transition-colors">
              <PlusIcon className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">Add media</span>
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFiles} />
            </label>
          )}
        </div>
        <p className="text-[11px] text-slate mt-1">Add up to {MAX_MEDIA}. A short video earns the most, then clear photos — the more you add, the higher your reward.</p>
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
