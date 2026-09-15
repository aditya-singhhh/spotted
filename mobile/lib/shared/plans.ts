// Copied from web src/lib/plans.ts — framework-free, shared verbatim. Keep in
// sync with the web version (or move both to an npm-workspaces package later).

export type PlanType = 'credits' | 'pass';

export type Plan = {
  id: string;
  label: string;
  price: number;
  type: PlanType;
  credits?: number;
  days?: number;
  badge?: string;
  active: boolean;
};

export type Entitlement = { credits: number; passExpiresAt: string | null };
export const EMPTY_ENTITLEMENT: Entitlement = { credits: 0, passExpiresAt: null };

export function normalizeEntitlement(raw: any): Entitlement {
  const credits = Number(raw?.credits);
  const passExpiresAt = typeof raw?.passExpiresAt === 'string' ? raw.passExpiresAt : null;
  return { credits: Number.isFinite(credits) && credits > 0 ? Math.floor(credits) : 0, passExpiresAt };
}

export function hasActivePass(e: Entitlement, now: number = Date.now()): boolean {
  if (!e.passExpiresAt) return false;
  const t = new Date(e.passExpiresAt).getTime();
  return Number.isFinite(t) && t > now;
}

export type UnlockMethod = 'pass' | 'credit' | 'single';

export function resolveUnlockMethod(e: Entitlement, now: number = Date.now()): UnlockMethod {
  if (hasActivePass(e, now)) return 'pass';
  if (e.credits > 0) return 'credit';
  return 'single';
}
