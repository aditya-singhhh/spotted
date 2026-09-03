'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

// Auth-aware header control: "Sign in" when signed out, account label + a
// working "Sign out" button once a Firebase session exists.
export default function AccountButton({ className = '' }: { className?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);

  // Avoid a flash of the wrong state before Firebase reports the session.
  if (!ready) return <span className={`btn btn-sm shrink-0 opacity-0 ${className}`} aria-hidden="true">Sign in</span>;

  if (!user) return <Link className={`btn btn-sm shrink-0 ${className}`} href="/login">Sign in</Link>;

  const label = user.email ?? user.phoneNumber ?? 'Account';
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      <span className="hidden sm:inline text-xs font-mono text-slate max-w-[160px] truncate" title={label}>{label}</span>
      <button
        type="button"
        className="btn btn-sm"
        onClick={async () => { await signOut(auth); router.push('/'); }}
      >
        Sign out
      </button>
    </div>
  );
}
