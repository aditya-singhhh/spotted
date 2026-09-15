import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';

type AuthState = { user: User | null; loading: boolean; signOut: () => Promise<void> };
const Ctx = createContext<AuthState>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) { try { await api('/api/profile', { method: 'POST' }); } catch { /* ensure-profile is best-effort */ } }
    });
  }, []);

  return <Ctx.Provider value={{ user, loading, signOut: () => fbSignOut(auth) }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
