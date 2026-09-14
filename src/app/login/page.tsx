'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import AuthGate from '@/components/AuthGate';

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-5 pt-10 text-center">
      <Link href="/" className="font-display text-xl">spotted.</Link>
      <p className="section-label mt-10">Your rental network</p>
      <h1 className="text-4xl mt-2">Sign in and find your next place.</h1>
      <p className="text-sm text-slate mt-3">Create one account to rent, scout, and track your activity.</p>
      <AuthGate mode="form">{(user) => <SignedIn user={user} />}</AuthGate>
    </main>
  );
}

// Once signed in, bounce back to wherever the user came from (?next=…), else Explore.
function SignedIn({ user }: { user: User }) {
  const router = useRouter();
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    const safe = next && next.startsWith('/') ? next : '/discover';
    router.replace(safe);
  }, [router, user]);
  return <div className="sticker p-6 bg-greenSoft mt-6"><h2 className="text-xl">You&apos;re signed in.</h2><p className="text-sm text-slate mt-1">Taking you back…</p></div>;
}
