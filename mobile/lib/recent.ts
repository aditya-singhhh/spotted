import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecentItem = { id: string; bhk: number; rent: number; landmark: string; media?: string };
const KEY = 'recently-viewed';
const CAP = 12;

export async function pushRecent(item: RecentItem) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: RecentItem[] = raw ? JSON.parse(raw) : [];
    const next = [item, ...list.filter((x) => x.id !== item.id)].slice(0, CAP);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* best-effort */ }
}

export async function readRecent(): Promise<RecentItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
