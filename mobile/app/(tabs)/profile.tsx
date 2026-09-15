import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { readRecent, type RecentItem } from '../../lib/recent';
import { colors, radius, inr } from '../../lib/theme';
import ListingCard from '../../components/ListingCard';

export default function Profile() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [unlocks, setUnlocks] = useState<any[]>([]);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  const load = useCallback(() => {
    readRecent().then(setRecent);
    if (!user) return;
    api<{ unlocks: any[] }>('/api/tenant/unlocks').then((d) => setUnlocks(d.unlocks ?? [])).catch(() => {});
    api<{ listings: any[] }>('/api/shortlist').then((d) => setShortlist(d.listings ?? [])).catch(() => {});
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { readRecent().then(setRecent); }, []));

  if (loading) return <SafeAreaView style={s.safe} />;

  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="person-circle-outline" size={56} color={colors.slate} />
          <Text style={s.h2}>Sign in to your account</Text>
          <Text style={s.sub}>Rent, scout, and track your activity — one account.</Text>
          <Pressable style={s.btn} onPress={() => router.push('/login')}><Text style={s.btnTxt}>Sign in / Create account</Text></Pressable>
        </View>
        {recent.length > 0 && (
          <ScrollView style={{ marginTop: 8 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={s.secTitle}>Recently viewed</Text>
            {recent.map((r) => <ListingCard key={r.id} l={r} />)}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  const initial = (user.email || 'U').charAt(0).toUpperCase();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={s.headerRow}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initial}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.email} numberOfLines={1}>{user.email}</Text>
            <Text style={s.role}>Tenant</Text>
          </View>
          <Pressable onPress={signOut}><Ionicons name="log-out-outline" size={22} color={colors.slate} /></Pressable>
        </View>

        {recent.length > 0 && (
          <Section title="Recently viewed">
            {recent.slice(0, 6).map((r) => <ListingCard key={r.id} l={r} />)}
          </Section>
        )}

        <Section title={`Unlocked contacts${unlocks.length ? ` (${unlocks.length})` : ''}`}>
          {unlocks.length === 0 ? <Empty text="Unlock a listing to keep the owner's contact here." /> : unlocks.map((u) => (
            <View key={u.id} style={s.unlockRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.unlockName}>{u.listing ? `${u.listing.bhk} BHK · ${u.listing.landmark}` : 'Listing'}</Text>
                {u.owner?.phone && <Pressable onPress={() => Linking.openURL(`tel:${u.owner.phone}`)}><Text style={s.unlockPhone}>{u.owner.name ? `${u.owner.name} · ` : ''}{u.owner.phone}</Text></Pressable>}
              </View>
              <Pressable style={s.viewBtn} onPress={() => router.push(`/listing/${u.id}`)}><Text style={s.viewTxt}>View</Text></Pressable>
            </View>
          ))}
        </Section>

        <Section title={`Shortlisted${shortlist.length ? ` (${shortlist.length})` : ''}`}>
          {shortlist.length === 0 ? <Empty text="Tap the heart on any listing to save it." /> : shortlist.map((l) => <ListingCard key={l.id} l={l} />)}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 26 }}>
      <Text style={s.secTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Empty({ text }: { text: string }) {
  return <View style={s.empty}><Text style={s.emptyTxt}>{text}</Text></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, marginTop: 40 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 8 },
  sub: { fontSize: 14, color: colors.slate, textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 22, fontWeight: '800', color: colors.accent },
  email: { fontSize: 16, fontWeight: '700', color: colors.ink },
  role: { fontSize: 12, color: colors.slate, marginTop: 2 },
  secTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  empty: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16 },
  emptyTxt: { fontSize: 13, color: colors.slate },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  unlockName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  unlockPhone: { fontSize: 13, color: colors.accent, marginTop: 3 },
  viewBtn: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  viewTxt: { fontSize: 13, fontWeight: '700', color: colors.ink },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 48, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnTxt: { color: colors.white, fontWeight: '700' }
});
