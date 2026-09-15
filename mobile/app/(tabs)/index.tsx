import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { colors, radius } from '../../lib/theme';
import ListingCard from '../../components/ListingCard';

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    api<{ listings: any[] }>('/api/listings?limit=4').then((d) => setFeatured(d.listings ?? [])).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Text style={s.brand}>spotted.</Text>
        <Text style={s.h1}>Find rentals the{'\n'}internet missed.</Text>
        <Text style={s.sub}>Real homes spotted on real streets by your neighbours — verified, fresh, and broker-free.</Text>

        <Pressable style={s.cta} onPress={() => router.push('/discover')}>
          <Ionicons name="search-outline" size={18} color={colors.white} />
          <Text style={s.ctaTxt}>Browse rentals</Text>
        </Pressable>

        <View style={s.trustRow}>
          <View style={s.trustItem}><Ionicons name="shield-checkmark-outline" size={15} color={colors.green} /><Text style={s.trustTxt}>Verified</Text></View>
          <View style={s.trustItem}><Ionicons name="sparkles-outline" size={15} color={colors.accent} /><Text style={s.trustTxt}>Fresh daily</Text></View>
          <View style={s.trustItem}><Ionicons name="checkmark-circle-outline" size={15} color={colors.green} /><Text style={s.trustTxt}>Zero brokerage</Text></View>
        </View>

        {featured.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={s.secHead}>
              <Text style={s.secTitle}>Just spotted</Text>
              <Pressable onPress={() => router.push('/discover')}><Text style={s.link}>View all →</Text></Pressable>
            </View>
            {featured.map((l) => <ListingCard key={l.id} l={l} />)}
          </View>
        )}

        <Pressable style={s.scoutCard} onPress={() => router.push('/scout')}>
          <Text style={s.scoutTitle}>See a TO-LET board?</Text>
          <Text style={s.scoutSub}>Snap it and earn every time a renter unlocks it.</Text>
          <Text style={s.scoutLink}>Become a scout →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  brand: { fontSize: 20, fontWeight: '800', color: colors.ink },
  h1: { fontSize: 34, fontWeight: '800', color: colors.ink, marginTop: 20, lineHeight: 40 },
  sub: { fontSize: 15, color: colors.slate, marginTop: 12, lineHeight: 22 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.ink, borderRadius: radius.md, height: 50, marginTop: 20 },
  ctaTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  trustRow: { flexDirection: 'row', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustTxt: { color: colors.slate, fontSize: 13 },
  secHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle: { fontSize: 20, fontWeight: '700', color: colors.ink },
  link: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  scoutCard: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 20, marginTop: 24 },
  scoutTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  scoutSub: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6 },
  scoutLink: { color: colors.accent, fontWeight: '700', marginTop: 14, fontSize: 14 }
});
