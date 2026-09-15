import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { colors, radius, mono, inr } from '../../lib/theme';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [unlocked, setUnlocked] = useState<any>(null);
  const [price, setPrice] = useState(29);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ listing: any }>(`/api/listings/${id}`).then((d) => setListing(d.listing)).catch((e) => setError(e.message));
    api<{ unlockPrice: number }>('/api/plans').then((d) => setPrice(d.unlockPrice || 29)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api(`/api/unlock?rentalOpportunityId=${id}`).then((d: any) => { if (d.unlocked) setUnlocked(d); }).catch(() => {});
  }, [user, id]);

  async function unlock() {
    if (!user) { router.push('/login'); return; }
    setBusy(true);
    try {
      const d = await api('/api/unlock', { method: 'POST', body: { rentalOpportunityId: id } });
      setUnlocked(d);
    } catch (e) {
      Alert.alert('Unlock failed', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  if (error) return <View style={s.center}><Text style={s.err}>{error}</Text></View>;
  if (!listing) return <View style={s.center}><ActivityIndicator color={colors.ink} /></View>;

  const gallery: string[] = Array.isArray(listing.mediaUrls) && listing.mediaUrls.length ? listing.mediaUrls : listing.media ? [listing.media] : [];

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.hero}>
        {gallery[0] ? <Image source={{ uri: gallery[0] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="home-outline" size={56} color={colors.slate} />}
      </View>

      <View style={s.pad}>
        <Text style={s.title}>{listing.bhk} BHK near {listing.landmark}</Text>
        <Text style={s.price}>{inr(listing.rent)}<Text style={s.mo}> / month</Text></Text>

        <View style={s.facts}>
          <Fact label="Size" value={`${listing.bhk} BHK`} />
          <Fact label="Deposit" value={inr(listing.deposit)} />
          <Fact label="Furnishing" value={listing.furnishing || 'Unfurnished'} />
          <Fact label="Trust" value={`${listing.trustScore ?? 0}/100`} />
        </View>

        {!unlocked ? (
          <View style={s.unlockCard}>
            <View style={s.rowBetween}>
              <Text style={s.unlockTitle}>Unlock owner contact</Text>
              <Text style={s.unlockPrice}>{inr(price)}</Text>
            </View>
            {['Owner name & phone', 'Exact location + Maps', 'Kept in your profile'].map((t) => (
              <View key={t} style={s.li}><Ionicons name="checkmark" size={15} color={colors.green} /><Text style={s.liTxt}>{t}</Text></View>
            ))}
            <Pressable style={s.btn} onPress={unlock} disabled={busy}>
              <Text style={s.btnTxt}>{busy ? 'Unlocking…' : user ? `Unlock now · ${inr(price)}` : 'Sign in to unlock'}</Text>
            </Pressable>
            <Text style={s.fine}>One-time fee · no brokerage · no subscription.</Text>
          </View>
        ) : (
          <View style={s.unlockedCard}>
            <View style={s.badge}><Ionicons name="lock-open-outline" size={13} color={colors.green} /><Text style={s.badgeTxt}>Unlocked</Text></View>
            <Text style={s.owner}>{unlocked.owner?.name || 'Owner'}</Text>
            {unlocked.owner?.phone && (
              <Pressable onPress={() => Linking.openURL(`tel:${unlocked.owner.phone}`)}><Text style={s.phone}>{unlocked.owner.phone}</Text></Pressable>
            )}
            {unlocked.location?.address && <Text style={s.addr}>{unlocked.location.address}</Text>}
            {typeof unlocked.location?.lat === 'number' && (
              <Pressable style={s.mapBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${unlocked.location.lat},${unlocked.location.lng}`)}>
                <Ionicons name="location-outline" size={16} color={colors.white} /><Text style={s.mapBtnTxt}>Open in Maps</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fact}>
      <Text style={s.factLabel}>{label}</Text>
      <Text style={s.factValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  err: { color: colors.red, padding: 24, textAlign: 'center' },
  hero: { height: 240, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  price: { fontSize: 22, fontWeight: '800', color: colors.ink, fontFamily: mono, marginTop: 8 },
  mo: { fontSize: 13, fontWeight: '400', color: colors.slate },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  fact: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12 },
  factLabel: { fontSize: 11, textTransform: 'uppercase', color: colors.slate, fontWeight: '600', letterSpacing: 0.5 },
  factValue: { fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: 4, textTransform: 'capitalize' },
  unlockCard: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, marginTop: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unlockTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  unlockPrice: { fontSize: 16, fontWeight: '800', color: colors.accent, fontFamily: mono },
  li: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  liTxt: { fontSize: 13, color: colors.slate },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  fine: { fontSize: 11, color: colors.slate, textAlign: 'center', marginTop: 8 },
  unlockedCard: { backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(5,150,105,0.2)', borderRadius: radius.lg, padding: 16, marginTop: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.paper, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { color: colors.green, fontWeight: '700', fontSize: 12 },
  owner: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 12 },
  phone: { fontSize: 15, color: colors.ink, fontFamily: mono, textDecorationLine: 'underline', marginTop: 4 },
  addr: { fontSize: 14, color: colors.slate, marginTop: 10 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.ink, borderRadius: radius.md, height: 44, marginTop: 14 },
  mapBtnTxt: { color: colors.white, fontWeight: '700' }
});
