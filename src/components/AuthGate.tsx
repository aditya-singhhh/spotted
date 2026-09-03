'use client';

import { useEffect, useRef, useState } from 'react';
import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  onAuthStateChanged,
  type ConfirmationResult,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

/**
 * Real phone-OTP sign-in using Firebase Auth (actual SMS is sent —
 * no third-party SMS provider needed, unlike most other backends).
 * Renders `children` once a session exists; otherwise shows a
 * "send code / enter code" form.
 *
 * Requires: Firebase Console → Authentication → Sign-in method →
 * enable "Phone". On the free Spark plan you get a daily SMS quota
 * that's plenty for testing; upgrade to Blaze (still free at low
 * volume) before real launch.
 */
export default function AuthGate({ children }: { children: (user: User) => React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('+91');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerId = 'recaptcha-container';

  useEffect(() => {
    const fallback = window.setTimeout(() => setLoading(false), 2500);
    const unsub = onAuthStateChanged(auth, async (u) => {
      // Render the Firebase session immediately. Profile bootstrapping should
      // never make the whole app appear frozen on a slow network.
      setUser(u);
      setLoading(false);
      window.clearTimeout(fallback);
      if (u) {
        try {
          const token = await u.getIdToken();
          await fetch('/api/profile', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        } catch {
          // The gate still renders the Firebase session. Server routes will
          // show a precise configuration error if profile setup is unavailable.
        }
      }
    });
    return () => { window.clearTimeout(fallback); unsub(); };
  }, []);

  function getRecaptcha() {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
    }
    return recaptchaRef.current;
  }

  async function sendCode() {
    setError('');
    setSending(true);
    try {
      const verifier = getRecaptcha();
      confirmationRef.current = await signInWithPhoneNumber(auth, phone, verifier);
      setOtpSent(true);
    } catch (e: any) {
      setError(friendlyAuthError(e, 'Could not send code — check the number and try again.'));
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    setError('');
    try {
      await confirmationRef.current?.confirm(code);
    } catch (e: any) {
      setError(friendlyAuthError(e, 'Invalid code — please try again.'));
    }
  }

  async function signInWithEmail() {
    setError('');
    setSending(true);
    try {
      if (!email.trim() || password.length < 6) throw new Error('Enter a valid email and a password with at least 6 characters.');
      if (isNewAccount) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(friendlyAuthError(e, 'Could not sign in.'));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading…</div>;
  if (user) return <>{children(user)}</>;

  return (
    <div className="sticker p-6 max-w-sm mx-auto mt-6">
      <h3 className="text-lg mb-1">Sign in to continue</h3>
      <p className="text-xs text-slate-500 mb-4">Save discoveries, unlock contact details, and track your scout earnings.</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button type="button" className={`btn btn-sm ${method === 'email' ? 'btn-yellow' : ''}`} onClick={() => setMethod('email')}>Email</button>
        <button type="button" className={`btn btn-sm ${method === 'phone' ? 'btn-yellow' : ''}`} onClick={() => setMethod('phone')}>Phone OTP</button>
      </div>
      {method === 'email' ? (
        <>
          <label className="text-xs font-bold block mb-1">Email address</label>
          <input className="input mb-3" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="text-xs font-bold block mb-1">Password</label>
          <input className="input mb-3" type="password" autoComplete={isNewAccount ? 'new-password' : 'current-password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-primary w-full" onClick={signInWithEmail} disabled={sending}>{sending ? 'Please wait…' : isNewAccount ? 'Create account' : 'Sign in'}</button>
          <button type="button" className="text-xs font-bold underline w-full mt-3" onClick={() => setIsNewAccount(!isNewAccount)}>{isNewAccount ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
        </>
      ) : !otpSent ? (
        <>
          <input
            className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm mb-3"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button className="btn btn-primary w-full" onClick={sendCode} disabled={sending}>
            {sending ? 'Sending…' : 'Send code'}
          </button>
        </>
      ) : (
        <>
          <input
            className="w-full border-2 border-ink rounded-xl px-3 py-2 text-sm mb-3"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="btn btn-primary w-full" onClick={verifyCode}>
            Verify &amp; sign in
          </button>
        </>
      )}
      {error && <p className="text-xs text-red mt-3">{error}</p>}
      {/* Invisible reCAPTCHA anchor required by Firebase Phone Auth */}
      <div id={recaptchaContainerId} />
    </div>
  );
}

function friendlyAuthError(error: any, fallback: string) {
  const code = String(error?.code ?? '');
  if (code.includes('network-request-failed')) return 'Can’t reach Firebase right now. Check your internet connection, then try again.';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'That email or password does not match an account.';
  if (code.includes('email-already-in-use')) return 'An account already exists with this email. Try signing in instead.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('weak-password')) return 'Use a password with at least 6 characters.';
  return fallback;
}
