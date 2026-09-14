import type { Area } from '@/content/areas';

// Does a public listing belong to this area? Matches the listing's landmark
// text against the area's matchTerms (case-insensitive substring).
export function listingInArea(listing: any, area: Area): boolean {
  const hay = String(listing?.landmark ?? '').toLowerCase();
  return area.matchTerms.some((t) => hay.includes(t.toLowerCase()));
}

export type RentStats = {
  count: number;
  avgRent: number | null;
  minRent: number | null;
  maxRent: number | null;
  byBhk: { bhk: string; count: number; avgRent: number | null }[];
  freshCount: number; // spotted in the last 14 days
};

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// Compute rent stats for one area from the (already-public) feed listings.
export function computeRentStats(listings: any[], area: Area): RentStats {
  const inArea = listings.filter((l) => listingInArea(l, area));
  const rents = inArea.map((l) => Number(l.rent)).filter((n) => Number.isFinite(n) && n > 0);
  const now = Date.now();
  const freshCount = inArea.filter((l) => {
    const t = l.spottedAt ? new Date(l.spottedAt).getTime() : NaN;
    return Number.isFinite(t) && now - t < 14 * 86400000;
  }).length;

  const byBhkMap = new Map<string, number[]>();
  for (const l of inArea) {
    const bhk = String(l.bhk ?? '?');
    const r = Number(l.rent);
    if (!byBhkMap.has(bhk)) byBhkMap.set(bhk, []);
    if (Number.isFinite(r) && r > 0) byBhkMap.get(bhk)!.push(r);
  }
  const byBhk = [...byBhkMap.entries()]
    .map(([bhk, rs]) => ({ bhk, count: rs.length, avgRent: median(rs) }))
    .sort((a, b) => a.bhk.localeCompare(b.bhk));

  return {
    count: inArea.length,
    avgRent: median(rents),
    minRent: rents.length ? Math.min(...rents) : null,
    maxRent: rents.length ? Math.max(...rents) : null,
    byBhk,
    freshCount
  };
}
