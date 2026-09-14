// Pricing packages ("plans") the renter can buy to unlock owner contacts.
// A plan is either a CREDITS pack (buy N unlocks, consumed one per unlock) or a
// time PASS (unlimited unlocks for M days). Admin configures these; the single
// pay-per-unlock price (settings.unlockPrice) is the fallback when a renter has
// no plan. Kept pure + framework-free so it can be unit-tested.

export type PlanType = 'credits' | 'pass';

export type Plan = {
  id: string;
  label: string; // "Starter pack", "Unlimited month"
  price: number; // rupees
  type: PlanType;
  credits?: number; // for type 'credits' — number of unlocks granted
  days?: number; // for type 'pass' — validity window in days
  badge?: string; // optional marketing tag e.g. "Best value"
  active: boolean;
};

// Shipped defaults so the marketplace has sensible packs before an admin edits them.
export const DEFAULT_PLANS: Plan[] = [
  { id: 'pack3', label: '3-unlock pack', price: 49, type: 'credits', credits: 3, active: true },
  { id: 'pack7', label: '7-unlock pack', price: 99, type: 'credits', credits: 7, badge: 'Popular', active: true },
  { id: 'month', label: 'Unlimited · 30 days', price: 199, type: 'pass', days: 30, badge: 'Best value', active: true }
];

export type Entitlement = { credits: number; passExpiresAt: string | null };

export const EMPTY_ENTITLEMENT: Entitlement = { credits: 0, passExpiresAt: null };

// Normalise a raw entitlement doc into a safe shape.
export function normalizeEntitlement(raw: any): Entitlement {
  const credits = Number(raw?.credits);
  const passExpiresAt = typeof raw?.passExpiresAt === 'string' ? raw.passExpiresAt : null;
  return { credits: Number.isFinite(credits) && credits > 0 ? Math.floor(credits) : 0, passExpiresAt };
}

// Is a pass currently active?
export function hasActivePass(e: Entitlement, now: number = Date.now()): boolean {
  if (!e.passExpiresAt) return false;
  const t = new Date(e.passExpiresAt).getTime();
  return Number.isFinite(t) && t > now;
}

export type UnlockMethod = 'pass' | 'credit' | 'single';

// Decide how the next unlock is paid for, given the renter's entitlement.
// pass (free, already paid) → credit (consume one) → single (charge unlockPrice).
export function resolveUnlockMethod(e: Entitlement, now: number = Date.now()): UnlockMethod {
  if (hasActivePass(e, now)) return 'pass';
  if (e.credits > 0) return 'credit';
  return 'single';
}

// Apply a purchased plan to an existing entitlement, returning the new one.
// Credits stack; buying a pass extends from the later of now / current expiry.
export function applyPlan(e: Entitlement, plan: Plan, now: number = Date.now()): Entitlement {
  if (plan.type === 'credits') {
    return { ...e, credits: e.credits + Math.max(0, Math.floor(plan.credits ?? 0)) };
  }
  const base = hasActivePass(e, now) ? new Date(e.passExpiresAt as string).getTime() : now;
  const expires = base + Math.max(0, Math.floor(plan.days ?? 0)) * 86400000;
  return { ...e, passExpiresAt: new Date(expires).toISOString() };
}

// Validate + normalise an admin-submitted plans array. Returns {error} or {plans}.
export function validatePlans(input: any): { error: string } | { plans: Plan[] } {
  if (!Array.isArray(input)) return { error: 'Plans must be a list.' };
  if (input.length > 12) return { error: 'Keep it to 12 plans or fewer.' };
  const ids = new Set<string>();
  const plans: Plan[] = [];
  for (const raw of input) {
    const id = String(raw?.id ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const label = String(raw?.label ?? '').trim();
    const price = Number(raw?.price);
    const type = raw?.type === 'pass' ? 'pass' : 'credits';
    if (!id) return { error: 'Every plan needs an id.' };
    if (ids.has(id)) return { error: `Duplicate plan id: ${id}` };
    ids.add(id);
    if (!label) return { error: `Plan ${id} needs a label.` };
    if (!Number.isInteger(price) || price < 1 || price > 99999) return { error: `Plan ${id}: price must be ₹1–99,999.` };
    const plan: Plan = { id, label, price, type, active: raw?.active !== false };
    if (raw?.badge) plan.badge = String(raw.badge).slice(0, 24);
    if (type === 'credits') {
      const credits = Number(raw?.credits);
      if (!Number.isInteger(credits) || credits < 1 || credits > 999) return { error: `Plan ${id}: credits must be 1–999.` };
      plan.credits = credits;
    } else {
      const days = Number(raw?.days);
      if (!Number.isInteger(days) || days < 1 || days > 365) return { error: `Plan ${id}: days must be 1–365.` };
      plan.days = days;
    }
    plans.push(plan);
  }
  return { plans };
}

export function getPlan(plans: Plan[], id: string): Plan | undefined {
  return plans.find((p) => p.id === id && p.active);
}
