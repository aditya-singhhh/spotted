'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { STATUS_LABEL } from '@/lib/scoutRequests';
import { MapPinIcon, CheckIcon, SparkleIcon } from '@/components/icons';

export default function RequestScoutPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 md:px-6 pt-8 pb-16">
      <div className="text-center max-w-xl mx-auto">
        <p className="section-label">Can’t find it? We’ll go look.</p>
        <h1 className="text-3xl sm:text-4xl mt-2">Request a scout for your area</h1>
        <p className="text-slate mt-3 leading-relaxed">Tell us where you want to live. We assign a local scout — often a delivery rider who already covers those streets — to spot fresh TO-LET boards and share matching homes with you.</p>
      </div>
      <div className="mt-8">
        <AuthGate>{() => <RequestFlow />}</AuthGate>
      </div>
    </main>
  );
}

function RequestFlow() {
  const [form, setForm] = useState({ area: '', bhk: 'any', budgetMax: '', moveIn: '', notes: '' });
  const [requests, setRequests] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function load() {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    const res = await fetch('/api/scout-requests?view=mine', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setRequests((await res.json()).requests ?? []);
  }
  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { if (u) load(); }); return () => unsub(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(''); setDone(false);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/scout-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'create', ...form }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? 'Could not submit your request.');
      else { setDone(true); setForm({ area: '', bhk: 'any', budgetMax: '', moveIn: '', notes: '' }); load(); }
    } catch { setError('Could not submit your request. Please try again.'); } finally { setSubmitting(false); }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_.9fr] gap-6 items-start">
      <form onSubmit={submit} className="sticker p-5 space-y-4">
        {done && <div className="rounded-xl bg-greenSoft border border-green/20 p-3 text-sm flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green" /> Request received — we’ll assign a scout soon.</div>}
        {error && <div className="rounded-xl bg-redSoft border border-red/20 p-3 text-sm text-red">{error}</div>}
        <label className="block text-sm font-semibold">Which area?
          <div className="flex items-center gap-2 input mt-1"><MapPinIcon className="w-4 h-4 text-slate shrink-0" /><input required value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="HSR Layout, Koramangala 5th block…" className="w-full bg-transparent outline-none" /></div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">Home size
            <select value={form.bhk} onChange={(e) => setForm({ ...form, bhk: e.target.value })} className="input mt-1"><option value="any">Any</option><option value="1">1 BHK</option><option value="2">2 BHK</option><option value="3">3 BHK</option><option value="4">4+ BHK</option></select>
          </label>
          <label className="block text-sm font-semibold">Max budget ₹/mo
            <input type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} placeholder="30000" className="input mt-1" />
          </label>
        </div>
        <label className="block text-sm font-semibold">Move-in
          <input value={form.moveIn} onChange={(e) => setForm({ ...form, moveIn: e.target.value })} placeholder="This month, flexible…" className="input mt-1" />
        </label>
        <label className="block text-sm font-semibold">Anything specific?
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Near the metro, pet-friendly, ground floor, semi-furnished…" className="input mt-1 resize-none" />
        </label>
        <button className="btn btn-primary w-full" disabled={submitting}>{submitting ? 'Sending…' : 'Request a scout'}</button>
        <p className="text-xs text-slate text-center">Free while we’re getting started. No spam — you’ll be notified when listings are shared.</p>
      </form>

      <div className="space-y-3">
        <div className="panel p-4">
          <p className="section-label mb-2">How it works</p>
          <ol className="space-y-2.5 text-sm">
            {['You tell us the area + budget', 'We assign a local scout on that route', 'They spot fresh boards and share matches', 'You unlock the ones you like'].map((s, i) => (
              <li key={s} className="flex gap-2.5"><span className="font-mono text-xs text-slate mt-0.5">0{i + 1}</span> {s}</li>
            ))}
          </ol>
        </div>

        <div>
          <p className="section-label mb-2">Your requests</p>
          {requests.length === 0 ? (
            <div className="panel p-4 text-sm text-slate">No requests yet. Send your first above.</div>
          ) : (
            <div className="space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="panel p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5 text-slate" /> {r.area}</span>
                    <span className={`badge ${r.status === 'fulfilled' ? 'badge-green' : r.status === 'assigned' ? 'badge-accent' : 'badge-yellow'}`}>{STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status}</span>
                  </div>
                  <p className="text-xs text-slate mt-1">{r.bhk !== 'any' ? `${r.bhk} BHK · ` : ''}{r.budgetMax ? `up to ₹${Number(r.budgetMax).toLocaleString('en-IN')}` : 'any budget'}</p>
                  {r.status === 'fulfilled' && Array.isArray(r.matchedListingIds) && r.matchedListingIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.matchedListingIds.map((id: string, i: number) => (
                        <Link key={id} href={`/listing/${id}`} className="badge badge-accent"><SparkleIcon className="w-3 h-3" /> Match {i + 1}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
