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

  // Optimistic: update the row instantly, sync to the DB in the background,
  // and only roll back (and reload) if the request actually fails.
  async function act(id: string, action: string) {
    const statusMap: Record<string, string> = { verify: 'verified', reject: 'rejected', mark_duplicate: 'rejected', mark_rented: 'rented' };
    const newStatus = statusMap[action] ?? action;
    const prev = data;
    setError('');
    setData((d: any) => ({ ...d, listings: d.listings.map((l: any) => (l.id === id ? { ...l, status: newStatus } : l)) }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rentalOpportunityId: id, action }) });
      if (!res.ok) throw new Error();
    } catch { setData(prev); setError('Action failed — reverted.'); }
  }

  async function del(id: string) {
    if (!confirm('Delete this listing permanently? This removes its property, contact and evidence.')) return;
    const prev = data;
    setError('');
    setData((d: any) => ({ ...d, listings: d.listings.filter((l: any) => l.id !== id) }));
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
    } catch { setData(prev); setError('Delete failed — restored.'); }
  }

  function startEdit(l: any) {
    setEditing(l.id);
    setEditForm({ bhk: l.bhk, rent: l.rent, deposit: l.deposit ?? 0, landmark: l.landmark ?? '', furnishing: l.furnishing ?? 'unfurnished', bachelorAllowed: l.bachelorAllowed ?? 'unknown', status: l.status });
  }

  async function saveEdit(id: string) {
    const patch = { ...editForm };
    const prev = data;
    setError('');
    setEditing(null);
    setData((d: any) => ({ ...d, listings: d.listings.map((l: any) => (l.id === id ? { ...l, ...patch } : l)) }));
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error();
    } catch { setData(prev); setError('Update failed — reverted.'); }
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
    setError('');
    const prevWallet = wallet;
    if (action === 'approve_reward' && rewardId) {
      setWallet((w: any) => ({ ...w, rewards: w.rewards.map((r: any) => (r.id === rewardId ? { ...r, status: 'available' } : r)) }));
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(action === 'set_price' ? { action, amount: price } : { action, rewardId }) });
      if (!res.ok) throw new Error();
      if (action === 'set_price') load();
    } catch { setWallet(prevWallet); setError('Wallet action failed.'); }
  }

  async function withdrawalAction(action: 'mark_paid' | 'reject_withdrawal', withdrawalId: string) {
    setError('');
    const prevWallet = wallet;
    const nextStatus = action === 'mark_paid' ? 'paid' : 'rejected';
    setWallet((w: any) => ({ ...w, withdrawals: (w.withdrawals ?? []).map((x: any) => (x.id === withdrawalId ? { ...x, status: nextStatus } : x)) }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, withdrawalId }) });
      if (!res.ok) throw new Error();
    } catch { setWallet(prevWallet); setError('Withdrawal action failed.'); }
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

      <section className="mb-8"><div className="flex justify-between items-end mb-3"><div><p className="section-label">Payout requests</p><h2 className="text-xl mt-1">Scout withdrawals</h2></div><span className="text-xs text-slate">Pay out, then mark paid.</span></div>{wallet?.withdrawals?.filter((w: any) => w.status === 'requested').length ? <div className="grid gap-2">{wallet.withdrawals.filter((w: any) => w.status === 'requested').map((w: any) => <div key={w.id} className="sticker p-3 flex flex-wrap gap-3 justify-between items-center"><div><p className="font-bold">₹{Number(w.amount).toLocaleString('en-IN')} · Scout {String(w.scoutId).slice(0, 12)}</p><p className="text-xs text-slate">{w.method?.type?.toUpperCase()}: {w.method?.value} · requested {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN') : ''}</p></div><div className="flex gap-2"><button className="btn btn-sm btn-primary" onClick={() => withdrawalAction('mark_paid', w.id)}>Mark paid</button><button className="btn btn-sm" onClick={() => withdrawalAction('reject_withdrawal', w.id)}>Reject</button></div></div>)}</div> : <div className="sticker p-4 text-sm text-slate">No payout requests.</div>}</section>

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
