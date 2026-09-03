'use client';

import { Fragment, useEffect, useState } from 'react';
import AuthGate from '@/components/AuthGate';
import { auth } from '@/lib/firebaseClient';
import type { User } from 'firebase/auth';
import TopBar from '@/components/TopBar';

export default function AdminPage() {
  return (
    <main className="max-w-5xl mx-auto px-5">
      <TopBar eyebrow="Private operations" title="Verification &amp; ops" />
      <AuthGate>{(user) => <AdminBoard user={user} />}</AuthGate>
    </main>
  );
}

function AdminBoard({ user }: { user: User }) {
  const [data, setData] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [price, setPrice] = useState('29');
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  async function load() {
    const token = await user.getIdToken();
    let res: Response;
    let body: any;
    try {
      res = await fetch('/api/admin/listings', { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(7000) });
      body = await res.json();
    } catch {
      setError('The database is taking too long to respond. Check the local certificate setup, then refresh.');
      return;
    }
    if (!res.ok) {
      setError(body.error ?? 'Failed to load — is your user set to role=admin in the users collection?');
      return;
    }
    setData(body);
    const walletRes = await fetch('/api/admin/wallet', { headers: { Authorization: `Bearer ${token}` } });
    if (walletRes.ok) { const walletBody = await walletRes.json(); setWallet(walletBody); setPrice(String(walletBody.unlockPrice)); }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, action: string) {
    const token = await user.getIdToken();
    await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rentalOpportunityId: id, action })
    });
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this listing permanently? This removes its property, contact and evidence.')) return;
    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Delete failed.'); return; }
    load();
  }

  function startEdit(l: any) {
    setEditing(l.id);
    setEditForm({ bhk: l.bhk, rent: l.rent, deposit: l.deposit ?? 0, landmark: l.landmark ?? '', furnishing: l.furnishing ?? 'unfurnished', bachelorAllowed: l.bachelorAllowed ?? 'unknown', status: l.status });
  }

  async function saveEdit(id: string) {
    const token = await user.getIdToken();
    const res = await fetch(`/api/admin/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editForm) });
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error || 'Update failed.'); return; }
    setEditing(null); load();
  }

  async function seedDatabase() {
    setSeeding(true);
    setError('');
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/seed', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    setSeeding(false);
    if (!res.ok) setError(body.error ?? 'Could not add starter rentals.');
    else load();
  }

  async function walletAction(action: string, rewardId?: string) {
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(action === 'set_price' ? { action, amount: price } : { action, rewardId }) });
    if (!res.ok) { const body = await res.json(); setError(body.error || 'Wallet action failed.'); return; }
    load();
  }

  if (error && !data) return <div className="sticker bg-redSoft p-5"><p className="font-bold">Admin access is not ready.</p><p className="text-sm text-red mt-2">{error}</p><p className="text-xs text-slate mt-3">Sign in through /login with your configured admin email, then refresh this page.</p></div>;
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><p className="text-sm text-slate">Review community submissions and keep the marketplace fresh.</p><button className="btn btn-sm btn-yellow" onClick={seedDatabase} disabled={seeding}>{seeding ? 'Adding rentals…' : 'Add starter rentals'}</button></div>
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))' }}>
        {Object.entries(data.metrics).map(([k, v]) => (
          <div key={k} className="sticker p-4">
            <div className="font-mono text-2xl font-bold">{v as number}</div>
            <div className="text-xs text-slate-500 capitalize mt-1">{k}</div>
          </div>
        ))}
      </div>

      <section className="sticker p-4 mb-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="section-label">Marketplace pricing</p><h2 className="text-xl mt-1">Contact unlock price</h2></div><div className="flex gap-2 items-center"><span className="font-mono">₹</span><input className="input w-24" type="number" value={price} onChange={e => setPrice(e.target.value)} /><button className="btn btn-sm btn-primary" onClick={() => walletAction('set_price')}>Save</button></div></div><p className="text-xs text-slate mt-3">A Scout earns 50% of each confirmed unlock. Payment collection is demo-mode until a payment gateway is connected.</p></section>

      <section className="mb-8"><div className="flex justify-between items-end mb-3"><div><p className="section-label">Scout wallet approvals</p><h2 className="text-xl mt-1">Pending earnings</h2></div><span className="text-xs text-slate">Approve only after checking the unlock.</span></div>{wallet?.rewards?.filter((r: any) => r.status === 'pending').length ? <div className="grid gap-2">{wallet.rewards.filter((r: any) => r.status === 'pending').map((r: any) => <div key={r.id} className="sticker p-3 flex flex-wrap gap-3 justify-between items-center"><div><p className="font-bold">₹{r.amount} pending for Scout {String(r.scoutId).slice(0, 12)}</p><p className="text-xs text-slate">Unlock {String(r.unlockTransactionId).slice(0, 10)} · awaiting payout approval</p></div><button className="btn btn-sm btn-yellow" onClick={() => walletAction('approve_reward', r.id)}>Approve to wallet</button></div>)}</div> : <div className="sticker p-4 text-sm text-slate">No Scout earnings awaiting approval.</div>}</section>

      <div className="sticker overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[10px] uppercase text-slate-500 border-b-2 border-ink">
              <th className="p-2">Property</th>
              <th className="p-2">Scout</th>
              <th className="p-2">Rent</th>
              <th className="p-2">Status</th>
              <th className="p-2">Trust</th>
              <th className="p-2">Unlocks</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.listings.map((l: any) => (
              <Fragment key={l.id}>
                <tr className="border-b border-dashed">
                  <td className="p-2">
                    {l.bhk} BHK · {l.landmark ?? '—'}
                  </td>
                  <td className="p-2 font-mono text-xs">{l.scoutName ?? l.scoutId?.slice(0, 8)}</td>
                  <td className="p-2 font-mono">₹{l.rent.toLocaleString('en-IN')}</td>
                  <td className="p-2">{l.status}</td>
                  <td className="p-2 font-mono">{l.trustScore}</td>
                  <td className="p-2 text-center">{l.unlocks}</td>
                  <td className="p-2 whitespace-nowrap">
                    <button className="btn btn-sm mr-1" title="Approve" onClick={() => act(l.id, 'verify')}>Approve</button>
                    <button className="btn btn-sm mr-1" title="Reject" onClick={() => act(l.id, 'reject')}>Reject</button>
                    <button className="btn btn-sm mr-1" onClick={() => startEdit(l)}>Edit</button>
                    <button className="btn btn-sm btn-dark" onClick={() => del(l.id)}>Delete</button>
                  </td>
                </tr>
                {editing === l.id && (
                  <tr className="border-b border-dashed bg-yellowSoft">
                    <td colSpan={7} className="p-3">
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <label className="text-xs font-bold">BHK<input className="input" type="number" value={editForm.bhk} onChange={(e) => setEditForm({ ...editForm, bhk: Number(e.target.value) })} /></label>
                        <label className="text-xs font-bold">Rent<input className="input" type="number" value={editForm.rent} onChange={(e) => setEditForm({ ...editForm, rent: Number(e.target.value) })} /></label>
                        <label className="text-xs font-bold">Deposit<input className="input" type="number" value={editForm.deposit} onChange={(e) => setEditForm({ ...editForm, deposit: Number(e.target.value) })} /></label>
                        <label className="text-xs font-bold">Landmark<input className="input" value={editForm.landmark} onChange={(e) => setEditForm({ ...editForm, landmark: e.target.value })} /></label>
                        <label className="text-xs font-bold">Furnishing<select className="input" value={editForm.furnishing} onChange={(e) => setEditForm({ ...editForm, furnishing: e.target.value })}><option>unfurnished</option><option>semi furnished</option><option>fully furnished</option></select></label>
                        <label className="text-xs font-bold">Status<select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option>pending</option><option>verified</option><option>community</option><option>rejected</option><option>rented</option></select></label>
                      </div>
                      <div className="flex gap-2 mt-3"><button className="btn btn-sm btn-primary" onClick={() => saveEdit(l.id)}>Save changes</button><button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button></div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
