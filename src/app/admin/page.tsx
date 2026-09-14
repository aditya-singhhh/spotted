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
  const [plans, setPlans] = useState<any[]>([]);
  const [savingPlans, setSavingPlans] = useState(false);
  const [tab, setTab] = useState<'overview' | 'requests' | 'payouts' | 'listings' | 'team'>('overview');
  const [reqData, setReqData] = useState<any>(null);
  const [assignPick, setAssignPick] = useState<Record<string, string>>({});
  const [team, setTeam] = useState<any[]>([]);
  const [grantEmail, setGrantEmail] = useState('');
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
    if (walletRes.ok) { const walletBody = await walletRes.json(); setWallet(walletBody); setPrice(String(walletBody.unlockPrice)); setPlans(Array.isArray(walletBody.plans) ? walletBody.plans : []); }
    const [rq, tm] = await Promise.all([
      fetch('/api/admin/scout-requests', { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/admin/team', { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ]);
    if (rq) setReqData(rq);
    if (tm) setTeam(tm.admins ?? []);
  }

  async function assignRequest(id: string) {
    const scoutId = assignPick[id];
    if (!scoutId) { setError('Pick a scout to assign.'); return; }
    setError('');
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/scout-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'assign', id, scoutId }) });
    if (res.ok) { const { assignedScoutName } = await res.json(); setReqData((d: any) => ({ ...d, requests: d.requests.map((r: any) => (r.id === id ? { ...r, status: 'assigned', assignedScoutId: scoutId, assignedScoutName } : r)) })); }
    else setError((await res.json()).error ?? 'Assign failed.');
  }
  async function closeRequest(id: string) {
    const token = await user.getIdToken();
    setReqData((d: any) => ({ ...d, requests: d.requests.map((r: any) => (r.id === id ? { ...r, status: 'closed' } : r)) }));
    fetch('/api/admin/scout-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'close', id }) }).catch(() => {});
  }
  async function teamAction(action: 'grant' | 'revoke', email: string) {
    setError('');
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, email }) });
    if (!res.ok) { setError((await res.json()).error ?? 'Team action failed.'); return; }
    if (action === 'grant') setGrantEmail('');
    const tm = await fetch('/api/admin/team', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null);
    if (tm) setTeam(tm.admins ?? []);
  }

  function updatePlan(i: number, patch: any) { setPlans((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p))); }
  function removePlan(i: number) { setPlans((ps) => ps.filter((_, idx) => idx !== i)); }
  function addPlan() { setPlans((ps) => [...ps, { id: `plan${ps.length + 1}`, label: 'New pack', price: 49, type: 'credits', credits: 3, active: true }]); }

  async function savePlans() {
    setSavingPlans(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'set_plans', plans }) });
      const b = await res.json();
      if (!res.ok) setError(b.error ?? 'Could not save packages.');
      else setPlans(b.plans);
    } catch { setError('Could not save packages.'); } finally { setSavingPlans(false); }
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
      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {([['overview', 'Overview'], ['requests', `Scout requests${reqData?.requests?.filter((r: any) => r.status === 'open').length ? ` · ${reqData.requests.filter((r: any) => r.status === 'open').length}` : ''}`], ['payouts', 'Payouts'], ['listings', 'Listings'], ['team', 'Team']] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === key ? 'border-ink text-ink' : 'border-transparent text-slate hover:text-ink'}`}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (<>
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))' }}>
        {Object.entries(data.metrics).map(([k, v]) => (
          <div key={k} className="sticker p-4">
            <div className="font-mono text-2xl font-bold">{v as number}</div>
            <div className="text-xs text-slate-500 capitalize mt-1">{k}</div>
          </div>
        ))}
      </div>

      {wallet && (() => {
        const purchases = (wallet.purchases ?? []).filter((p: any) => p.paymentStatus === 'success');
        const pkgRevenue = purchases.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
        const paidOut = (wallet.withdrawals ?? []).filter((w: any) => w.status === 'paid').reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
        const pendingRewards = (wallet.rewards ?? []).filter((r: any) => r.status === 'pending').reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        const kpis: [string, string][] = [
          ['Package revenue', `₹${pkgRevenue.toLocaleString('en-IN')}`],
          ['Packages sold', String(purchases.length)],
          ['Rewards pending', `₹${pendingRewards.toLocaleString('en-IN')}`],
          ['Paid to scouts', `₹${paidOut.toLocaleString('en-IN')}`]
        ];
        return (
          <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))' }}>
            {kpis.map(([k, v]) => (
              <div key={k} className="sticker p-4"><div className="font-mono text-2xl font-bold">{v}</div><div className="text-xs text-slate-500 mt-1">{k}</div></div>
            ))}
          </div>
        );
      })()}

      <section className="sticker p-4 mb-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="section-label">Marketplace pricing</p><h2 className="text-xl mt-1">Contact unlock price</h2></div><div className="flex gap-2 items-center"><span className="font-mono">₹</span><input className="input w-24" type="number" value={price} onChange={e => setPrice(e.target.value)} /><button className="btn btn-sm btn-primary" onClick={() => walletAction('set_price')}>Save</button></div></div><p className="text-xs text-slate mt-3">A Scout earns 50% of each confirmed unlock. Payment collection is demo-mode until a payment gateway is connected.</p></section>

      <section className="sticker p-4 mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div><p className="section-label">Marketplace pricing</p><h2 className="text-xl mt-1">Unlock packages</h2><p className="text-xs text-slate mt-1">Bundles renters can buy — credit packs or unlimited time passes. Fully configurable.</p></div>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={addPlan}>+ Add package</button>
            <button className="btn btn-sm btn-primary" onClick={savePlans} disabled={savingPlans}>{savingPlans ? 'Saving…' : 'Save packages'}</button>
          </div>
        </div>
        <div className="grid gap-2">
          {plans.length === 0 && <p className="text-sm text-slate">No packages yet — add one, or save to keep defaults.</p>}
          {plans.map((p, i) => (
            <div key={i} className={`panel p-3 grid gap-2 sm:grid-cols-[1.4fr_.7fr_.9fr_.9fr_1fr_auto] items-end ${p.active === false ? 'opacity-60' : ''}`}>
              <label className="text-xs font-bold">Label<input className="input" value={p.label ?? ''} onChange={(e) => updatePlan(i, { label: e.target.value })} /></label>
              <label className="text-xs font-bold">Price ₹<input className="input" type="number" value={p.price ?? 0} onChange={(e) => updatePlan(i, { price: Number(e.target.value) })} /></label>
              <label className="text-xs font-bold">Type<select className="input" value={p.type ?? 'credits'} onChange={(e) => updatePlan(i, { type: e.target.value })}><option value="credits">Credits</option><option value="pass">Time pass</option></select></label>
              {p.type === 'pass'
                ? <label className="text-xs font-bold">Days<input className="input" type="number" value={p.days ?? 30} onChange={(e) => updatePlan(i, { days: Number(e.target.value) })} /></label>
                : <label className="text-xs font-bold">Unlocks<input className="input" type="number" value={p.credits ?? 1} onChange={(e) => updatePlan(i, { credits: Number(e.target.value) })} /></label>}
              <label className="text-xs font-bold">Badge<input className="input" value={p.badge ?? ''} placeholder="e.g. Popular" onChange={(e) => updatePlan(i, { badge: e.target.value })} /></label>
              <div className="flex items-center gap-2 pb-1">
                <label className="text-xs font-bold flex items-center gap-1"><input type="checkbox" checked={p.active !== false} onChange={(e) => updatePlan(i, { active: e.target.checked })} /> Live</label>
                <button className="btn btn-sm btn-dark" onClick={() => removePlan(i)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      </>)}

      {tab === 'requests' && (
        <section className="mb-8">
          <div className="mb-4"><p className="section-label">Operations</p><h2 className="text-xl mt-1">Request-a-scout queue</h2><p className="text-xs text-slate mt-1">Assign a local scout to each renter request. The scout is notified in-app.</p></div>
          {!reqData?.requests?.length ? <div className="sticker p-4 text-sm text-slate">No scout requests yet.</div> : (
            <div className="grid gap-2">
              {reqData.requests.map((r: any) => (
                <div key={r.id} className="sticker p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{r.area} <span className={`badge ml-1 ${r.status === 'fulfilled' ? 'badge-green' : r.status === 'assigned' ? 'badge-accent' : r.status === 'closed' ? 'badge-ink' : 'badge-yellow'}`}>{r.status}</span></p>
                      <p className="text-xs text-slate mt-1">{r.bhk !== 'any' ? `${r.bhk} BHK · ` : ''}{r.budgetMax ? `up to ₹${Number(r.budgetMax).toLocaleString('en-IN')}` : 'any budget'}{r.moveIn ? ` · ${r.moveIn}` : ''}</p>
                      <p className="text-xs text-slate mt-0.5">Renter: {r.seekerEmail ?? r.seekerPhone ?? r.seekerId?.slice(0, 8)}</p>
                      {r.notes && <p className="text-sm mt-1.5">“{r.notes}”</p>}
                      {r.assignedScoutName && <p className="text-xs text-accent mt-1">Assigned to {r.assignedScoutName}</p>}
                    </div>
                    {(r.status === 'open' || r.status === 'assigned') && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <select className="input !w-auto" value={assignPick[r.id] ?? ''} onChange={(e) => setAssignPick({ ...assignPick, [r.id]: e.target.value })}>
                          <option value="">Pick a scout…</option>
                          {(reqData.scouts ?? []).map((sc: any) => <option key={sc.id} value={sc.id}>{sc.name}{sc.trustScore != null ? ` (trust ${sc.trustScore})` : ''}</option>)}
                        </select>
                        <button className="btn btn-sm btn-primary" onClick={() => assignRequest(r.id)}>{r.status === 'assigned' ? 'Reassign' : 'Assign'}</button>
                        <button className="btn btn-sm" onClick={() => closeRequest(r.id)}>Close</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'team' && (
        <section className="mb-8">
          <div className="mb-4"><p className="section-label">Access control</p><h2 className="text-xl mt-1">Admin team</h2><p className="text-xs text-slate mt-1">Grant or revoke admin access by email. The user must have signed in at least once.</p></div>
          <div className="sticker p-4 mb-4 flex flex-wrap gap-2 items-end">
            <label className="text-xs font-bold flex-1 min-w-[200px]">User email<input className="input mt-1" type="email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="person@example.com" /></label>
            <button className="btn btn-sm btn-primary" onClick={() => teamAction('grant', grantEmail)}>Grant admin</button>
          </div>
          <div className="sticker divide-y divide-line">
            {team.length === 0 ? <p className="text-sm text-slate p-4">No admins listed.</p> : team.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                <div><p className="font-semibold">{a.fullName || a.email || a.id}</p>{a.email && a.fullName && <p className="text-xs text-slate">{a.email}</p>}</div>
                <button className="btn btn-sm" onClick={() => a.email && teamAction('revoke', a.email)}>Revoke</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'payouts' && (<>
      <section className="mb-8"><div className="flex justify-between items-end mb-3"><div><p className="section-label">Scout wallet approvals</p><h2 className="text-xl mt-1">Pending earnings</h2></div><span className="text-xs text-slate">Approve only after checking the unlock.</span></div>{wallet?.rewards?.filter((r: any) => r.status === 'pending').length ? <div className="grid gap-2">{wallet.rewards.filter((r: any) => r.status === 'pending').map((r: any) => <div key={r.id} className="sticker p-3 flex flex-wrap gap-3 justify-between items-center"><div><p className="font-bold">₹{r.amount} pending for Scout {String(r.scoutId).slice(0, 12)}</p><p className="text-xs text-slate">Unlock {String(r.unlockTransactionId).slice(0, 10)} · awaiting payout approval</p></div><button className="btn btn-sm btn-yellow" onClick={() => walletAction('approve_reward', r.id)}>Approve to wallet</button></div>)}</div> : <div className="sticker p-4 text-sm text-slate">No Scout earnings awaiting approval.</div>}</section>

      <section className="mb-8"><div className="flex justify-between items-end mb-3"><div><p className="section-label">Payout requests</p><h2 className="text-xl mt-1">Scout withdrawals</h2></div><span className="text-xs text-slate">Pay out, then mark paid.</span></div>{wallet?.withdrawals?.filter((w: any) => w.status === 'requested').length ? <div className="grid gap-2">{wallet.withdrawals.filter((w: any) => w.status === 'requested').map((w: any) => <div key={w.id} className="sticker p-3 flex flex-wrap gap-3 justify-between items-center"><div><p className="font-bold">₹{Number(w.amount).toLocaleString('en-IN')} · Scout {String(w.scoutId).slice(0, 12)}</p><p className="text-xs text-slate">{w.method?.type?.toUpperCase()}: {w.method?.value} · requested {w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN') : ''}</p></div><div className="flex gap-2"><button className="btn btn-sm btn-primary" onClick={() => withdrawalAction('mark_paid', w.id)}>Mark paid</button><button className="btn btn-sm" onClick={() => withdrawalAction('reject_withdrawal', w.id)}>Reject</button></div></div>)}</div> : <div className="sticker p-4 text-sm text-slate">No payout requests.</div>}</section>

      </>)}

      {tab === 'listings' && (
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
      )}
    </>
  );
}
