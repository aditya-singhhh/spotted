import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { pushRecent } from '../../lib/recent';
import { colors, radius, mono, inr } from '../../lib/theme';
import { normalizeEntitlement, resolveUnlockMethod, hasActivePass, EMPTY_ENTITLEMENT, type Plan, type Entitlement } from '../../lib/shared/plans';

const REPORT_REASONS: [string, string][] = [
  ['rented', 'Already rented'],
  ['unreachable', 'Couldn’t reach the owner'],
  ['wrong_info', 'Details were wrong'],
  ['other', 'Something else']
];

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [unlocked, setUnlocked] = useState<any>(null);
  const [price, setPrice] = useState(29);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ent, setEnt] = useState<Entitlement>(EMPTY_ENTITLEMENT);
  const [busy, setBusy] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [showPacks, setShowPacks] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ listing: any }>(`/api/listings/${id}`).then((d) => {
      setListing(d.listing);
      pushRecent({ id: d.listing.id, bhk: d.listing.bhk, rent: d.listing.rent, landmark: d.listing.landmark, media: d.listing.media });
    }).catch((e) => setError(e.message));
    api<{ unlockPrice: number; plans: Plan[] }>('/api/plans').then((d) => { setPrice(d.unlockPrice || 29); setPlans(d.plans ?? []); }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api(`/api/unlock?rentalOpportunityId=${id}`).then((d: any) => { if (d.unlocked) setUnlocked(d); }).catch(() => {});
    api('/api/purchase').then((d: any) => setEnt(normalizeEntitlement(d))).catch(() => {});
    api<{ ids: string[] }>('/api/shortlist').then((d) => setSaved((d.ids ?? []).includes(String(id)))).catch(() => {});
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

  async function buyPlan(planId: string) {
    if (!user) { router.push('/login'); return; }
    setBuying(planId);
    try {
      const d = await api('/api/purchase', { method: 'POST', body: { planId } });
      setEnt(normalizeEntitlement((d as any).entitlement));
      setShowPacks(false);
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBuying(null); }
  }

  async function toggleSave() {
    if (!user) { router.push('/login'); return; }
    const next = !saved;
    setSaved(next);
    try { await api('/api/shortlist', { method: next ? 'POST' : 'DELETE', body: { rentalOpportunityId: id } }); }
    catch { setSaved(!next); }
  }

  async function report(reason: string) {
    try { await api('/api/listing-report', { method: 'POST', body: { rentalOpportunityId: id, reason } }); setReportDone(true); setReportOpen(false); }
    catch (e) { Alert.alert('Could not report', e instanceof Error ? e.message : 'Try again.'); }
  }

  if (error) return <View style={s.center}><Text style={s.err}>{error}</Text></View>;
  if (!listing) return <View style={s.center}><ActivityIndicator color={colors.ink} /></View>;

  const gallery: string[] = Array.isArray(listing.mediaUrls) && listing.mediaUrls.length ? listing.mediaUrls : listing.media ? [listing.media] : [];
  const method = resolveUnlockMethod(ent);
  const passActive = hasActivePass(ent);
  const ctaLabel = busy ? 'Unlocking…' : !user ? 'Sign in to unlock' : method === 'pass' ? 'Unlock now · Pass active' : method === 'credit' ? 'Unlock now · use 1 credit' : `Unlock now · ${inr(price)}`;
  const packs = plans.filter((p) => p.active !== false);

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.hero}>
        {gallery[0] ? <Image source={{ uri: gallery[0] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Ionicons name="home-outline" size={56} color={colors.slate} />}
        <Pressable style={s.saveBtn} onPress={toggleSave}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.red : colors.ink} />
        </Pressable>
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
              {passActive ? <Text style={[s.tag, { color: colors.green }]}>Unlimited</Text>
                : ent.credits > 0 ? <Text style={[s.tag, { color: colors.accent }]}>{ent.credits} credit{ent.credits === 1 ? '' : 's'}</Text>
                : <Text style={s.unlockPrice}>{inr(price)}</Text>}
            </View>
            {['Owner name & phone', 'Exact location + Maps', 'Kept in your profile'].map((t) => (
              <View key={t} style={s.li}><Ionicons name="checkmark" size={15} color={colors.green} /><Text style={s.liTxt}>{t}</Text></View>
            ))}
            <Pressable style={s.btn} onPress={unlock} disabled={busy}><Text style={s.btnTxt}>{ctaLabel}</Text></Pressable>

            {!passActive && packs.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Pressable onPress={() => setShowPacks((v) => !v)}><Text style={s.packToggle}>{showPacks ? 'Hide packs' : 'Searching for a few? Save with a pack ↓'}</Text></Pressable>
                {showPacks && packs.map((p) => (
                  <Pressable key={p.id} style={s.pack} onPress={() => buyPlan(p.id)} disabled={!!buying}>
                    <View style={s.rowBetween}>
                      <Text style={s.packLabel}>{p.label}{p.badge ? `  ·  ${p.badge}` : ''}</Text>
                      <Text style={s.packPrice}>{inr(p.price)}</Text>
                    </View>
                    <Text style={s.packSub}>{p.type === 'pass' ? `Unlimited for ${p.days} days` : `${p.credits} unlocks`}{buying === p.id ? ' · processing…' : ''}</Text>
                  </Pressable>
                ))}
                {showPacks && <Text style={s.fine}>Payments are in demo mode until the gateway is live.</Text>}
              </View>
            )}
          </View>
        ) : (
          <View style={s.unlockedCard}>
            <View style={s.badge}><Ionicons name="lock-open-outline" size={13} color={colors.green} /><Text style={s.badgeTxt}>Unlocked</Text></View>
            <Text style={s.owner}>{unlocked.owner?.name || 'Owner'}</Text>
            {unlocked.owner?.phone && <Pressable onPress={() => Linking.openURL(`tel:${unlocked.owner.phone}`)}><Text style={s.phone}>{unlocked.owner.phone}</Text></Pressable>}
            {unlocked.location?.address && <Text style={s.addr}>{unlocked.location.address}</Text>}
            {typeof unlocked.location?.lat === 'number' && (
              <Pressable style={s.mapBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${unlocked.location.lat},${unlocked.location.lng}`)}>
                <Ionicons name="location-outline" size={16} color={colors.white} /><Text style={s.mapBtnTxt}>Open in Maps</Text>
              </Pressable>
            )}
            <View style={s.reportWrap}>
              {reportDone ? (
                <Text style={s.reportDone}>Thanks — we’ll review this listing.</Text>
              ) : !reportOpen ? (
                <Pressable onPress={() => setReportOpen(true)}><Text style={s.reportLink}>Something wrong? Report this listing</Text></Pressable>
              ) : (
                <View>
                  <Text style={s.reportQ}>What went wrong?</Text>
                  {REPORT_REASONS.map(([r, label]) => (
                    <Pressable key={r} style={s.reason} onPress={() => report(r)}><Text style={s.reasonTxt}>{label}</Text></Pressable>
                  ))}
                  <Pressable onPress={() => setReportOpen(false)}><Text style={s.cancel}>Cancel</Text></Pressable>
                </View>
              )}
            </View>
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
  saveBtn: { position: 'absolute', top: 14, right: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
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
  tag: { fontSize: 13, fontWeight: '700' },
  li: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  liTxt: { fontSize: 13, color: colors.slate },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  btnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  packToggle: { color: colors.accent, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  pack: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginTop: 8 },
  packLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  packPrice: { fontSize: 15, fontWeight: '800', color: colors.ink, fontFamily: mono },
  packSub: { fontSize: 12, color: colors.slate, marginTop: 2 },
  fine: { fontSize: 11, color: colors.slate, textAlign: 'center', marginTop: 8 },
  unlockedCard: { backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: 'rgba(5,150,105,0.2)', borderRadius: radius.lg, padding: 16, marginTop: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.paper, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { color: colors.green, fontWeight: '700', fontSize: 12 },
  owner: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 12 },
  phone: { fontSize: 15, color: colors.ink, fontFamily: mono, textDecorationLine: 'underline', marginTop: 4 },
  addr: { fontSize: 14, color: colors.slate, marginTop: 10 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.ink, borderRadius: radius.md, height: 44, marginTop: 14 },
  mapBtnTxt: { color: colors.white, fontWeight: '700' },
  reportWrap: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(5,150,105,0.2)' },
  reportLink: { fontSize: 12, color: colors.slate, textDecorationLine: 'underline', fontWeight: '600' },
  reportDone: { fontSize: 12, color: colors.slate },
  reportQ: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  reason: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.paper, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  reasonTxt: { fontSize: 13, color: colors.ink },
  cancel: { fontSize: 11, color: colors.slate, textDecorationLine: 'underline', marginTop: 4 }
});
