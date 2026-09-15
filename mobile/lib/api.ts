import { auth } from './firebase';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

type Opts = { method?: string; body?: any; auth?: boolean };

// Fetch client for the hosted Next.js API. Attaches the Firebase ID token when a
// user is signed in (or when `auth: true` is required).
export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    try { headers.Authorization = `Bearer ${await user.getIdToken()}`; } catch { /* anon */ }
  }
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status})`);
  return data as T;
}
