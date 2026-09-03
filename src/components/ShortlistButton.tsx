'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { HeartIcon, HeartFilledIcon } from './icons';

// Save/unsave a listing to the tenant shortlist. Optimistic; no-op when signed out.
export default function ShortlistButton({ id, className = '', showLabel = false }: { id: string; className?: string; showLabel?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (!u) { setSaved(false); return; }
    try {
      const token = await u.getIdToken();
      const res = await fetch('/api/shortlist', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setSaved((d.ids ?? []).includes(id)); }
    } catch { /* ignore */ }
  }), [id]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.href = '/login'; return; }
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      const token = await user.getIdToken();
      await fetch('/api/shortlist', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rentalOpportunityId: id })
      });
    } catch {
      setSaved(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from shortlist' : 'Save to shortlist'}
      className={`inline-flex items-center gap-1.5 ${saved ? 'text-red' : 'text-ink'} ${className}`}
    >
      {saved ? <HeartFilledIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
      {showLabel && <span className="text-sm font-bold">{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
