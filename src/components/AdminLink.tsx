'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

// Renders an "Ops" link to the admin approval dashboard, but only for a
// signed-in user whose Firestore profile role is 'admin'.
export default function AdminLink({ className = '' }: { className?: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) { setIsAdmin(false); return; }
    try {
      const token = await u.getIdToken();
      const res = await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      setIsAdmin(body?.profile?.role === 'admin');
    } catch { setIsAdmin(false); }
  }), []);

  if (!isAdmin) return null;
  return <Link href="/admin" className={`badge badge-ink ${className}`}>Ops</Link>;
}
