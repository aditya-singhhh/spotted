// "Request a scout": a renter asks for a specific area to be scouted; admin
// assigns a scout (a delivery rider on that route); the scout fulfils it with
// matched listings. Pure validation + shared constants (framework-free, testable).

export const SCOUT_REQUEST_STATUSES = ['open', 'assigned', 'fulfilled', 'closed'] as const;
export type ScoutRequestStatus = (typeof SCOUT_REQUEST_STATUSES)[number];

export const STATUS_LABEL: Record<ScoutRequestStatus, string> = {
  open: 'Finding a scout',
  assigned: 'Scout on it',
  fulfilled: 'Listings shared',
  closed: 'Closed'
};

export type ScoutRequestInput = {
  area: string;
  bhk: string;
  budgetMax: number | null;
  moveIn: string;
  notes: string;
};

function clean(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

// Validate a renter's request. Returns {error} or {value}.
export function parseScoutRequest(body: any): { error: string } | { value: ScoutRequestInput } {
  const area = clean(body?.area, 80);
  if (area.length < 2) return { error: 'Tell us which area you want scouted.' };

  const bhkRaw = clean(body?.bhk, 8);
  const bhk = ['1', '2', '3', '4', 'any', ''].includes(bhkRaw) ? bhkRaw || 'any' : 'any';

  let budgetMax: number | null = null;
  if (body?.budgetMax !== undefined && body?.budgetMax !== null && body?.budgetMax !== '') {
    const n = Number(body.budgetMax);
    if (!Number.isFinite(n) || n < 1000 || n > 10000000) return { error: 'Enter a realistic monthly budget (₹1,000–₹1,00,00,000), or leave it blank.' };
    budgetMax = Math.round(n);
  }

  const moveIn = clean(body?.moveIn, 40);
  const notes = clean(body?.notes, 500);

  return { value: { area, bhk, budgetMax, moveIn, notes } };
}
