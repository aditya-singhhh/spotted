'use client';

import Link from 'next/link';
import AuthGate from '@/components/AuthGate';

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto px-5 pt-10 text-center">
      <Link href="/" className="font-display text-xl">spotted.</Link>
      <p className="section-label mt-10">Your rental network</p>
      <h1 className="text-4xl mt-2">Sign in and find your next place.</h1>
      <p className="text-sm text-slate mt-3">Create one account to rent, scout, and track your activity. Phone OTP is ready to enable when you launch.</p>
      <AuthGate>{() => <div className="sticker p-6 bg-greenSoft mt-6"><h2 className="text-xl">You&apos;re signed in.</h2><Link href="/discover" className="btn btn-primary mt-4">Explore rentals →</Link></div>}</AuthGate>
    </main>
  );
}
