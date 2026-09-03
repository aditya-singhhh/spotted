// Small, dependency-free request validators for API routes.

export function asString(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export function asFiniteNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function inRange(n: number | null, min: number, max: number): n is number {
  return n !== null && n >= min && n <= max;
}

export function isLatLng(lat: unknown, lng: unknown): boolean {
  const a = asFiniteNumber(lat);
  const b = asFiniteNumber(lng);
  return inRange(a, -90, 90) && inRange(b, -180, 180);
}

export function stringArray(v: unknown, maxItems = 12, maxLen = 2048): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((u): u is string => typeof u === 'string' && u.length > 0 && u.length <= maxLen)
    .slice(0, maxItems);
}
