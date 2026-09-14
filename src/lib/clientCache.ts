// Tiny localStorage cache so a refresh paints last-known data instantly while
// the network revalidates in the background (stale-while-revalidate on the client).
export function readCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

// Recently-viewed listings (per-browser), newest first, capped.
export type RecentItem = { id: string; bhk: number; rent: number; landmark: string; media?: string | null };
const RV_KEY = 'recentlyViewed';

export function readRecentlyViewed(): RecentItem[] {
  return readCache<RecentItem[]>(RV_KEY) ?? [];
}

export function pushRecentlyViewed(item: RecentItem) {
  const list = readRecentlyViewed().filter((x) => x.id !== item.id);
  list.unshift(item);
  writeCache(RV_KEY, list.slice(0, 12));
}
