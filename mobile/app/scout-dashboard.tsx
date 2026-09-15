import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { colors, radius, mono, inr } from '../lib/theme';

const MIN_WITHDRAWAL = 100;

export default function ScoutDashboard() {
  const [data, setData] = useState<any>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showW, setShowW] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [ids, setIds] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api('/api/scout/stats').then(setData).catch((e) => setError(e.message));
    api<{ requests: any[] }>('/api/scout-requests?view=assigned').then((d) => setAssigned(d.requests ?? [])).catch(() => {});
    api<{ notifications: any[] }>('/api/notifications').then((d) => setNotifs(d.notifications ?? [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function withdraw() {
    const amt = Number(amount);
    if (!method.trim()) return Alert.alert('Add payout details', 'Enter your UPI ID or bank account.');
    if (!(amt >= MIN_WITHDRAWAL)) return Alert.alert('Too low', `Minimum withdrawal is ₹${MIN_WITHDRAWAL}.`);
    try {
      await api('/api/scout/withdraw', { method: 'POST', body: { amount: amt, method: { type: method.includes('@') ? 'upi' : 'bank', value: method.trim() } } });
      setShowW(false); setAmount(''); setMethod(''); load();
    } catch (e) { Alert.alert('Withdrawal failed', e instanceof Error ? e.message : 'Try again.'); }
  }

  async function fulfill(id: string) {
    const matchedListingIds = (ids[id] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    try { await api('/api/scout-requests', { method: 'POST', body: { action: 'fulfill', id, matchedListingIds } }); load(); }
    catch (e) { Alert.alert('Could not share', e instanceof Error ? e.message : 'Try again.'); }
  }

  if (error && !data) return <View style={s.center}><Text style={s.err}>{error}</Text></View>;
  if (!data) return <View style={s.center}><ActivityIndicator color={colors.ink} /></View>;

  const sc = data.scout ?? {};
  const available = Number(sc.availableEarnings ?? 0);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <ScrollView style={{ backgroundColor: colors.paper }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Wallet */}
      <View style={s.wallet}>
        <Text style={s.wLabel}>Available to withdraw</Text>
        <Text style={s.wBig}>{inr(available)}</Text>
        <View style={s.wRow}>
          <WStat label="Pending" value={inr(sc.pendingEarnings)} />
          <WStat label="Total earned" value={inr(sc.totalEarned)} />
          <WStat label="Withdrawn" value={inr(sc.withdrawnEarnings)} />
        </View>
        <Pressable style={[s.wBtn, available < MIN_WITHDRAWAL && { opacity: 0.4 }]} disabled={available < MIN_WITHDRAWAL} onPress={() => setShowW((v) => !v)}>
          <Text style={s.wBtnTxt}>Withdraw</Text>
        </Pressable>
      </View>

      {showW && (
        <View style={s.card}>
          <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder={`Amount (up to ${available})`} placeholderTextColor={colors.slate} />
          <TextInput style={[s.input, { marginTop: 8 }]} value={method} onChangeText={setMethod} placeholder="UPI ID or bank account" placeholderTextColor={colors.slate} autoCapitalize="none" />
          <Pressable style={s.btn} onPress={withdraw}><Text style={s.btnTxt}>Request payout</Text></Pressable>
        </View>
      )}

      {/* KPIs */}
      <View style={s.kpis}>
        <Kpi label="Verified" value={String(data.verifiedDiscoveries ?? 0)} />
        <Kpi label="Connections" value={String(data.successfulConnections ?? 0)} />
        <Kpi label="Trust" value={`${sc.trustScore ?? 0}`} />
      </View>

      {notifs.length > 0 && (
        <Section title={`Notifications${unread ? ` · ${unread} new` : ''}`}>
          {notifs.slice(0, 6).map((n) => (
            <View key={n.id} style={[s.notif, !n.read && { backgroundColor: colors.accentSoft }]}>
              <Text style={s.notifT}>{n.title}</Text>
              <Text style={s.notifB}>{n.body}</Text>
            </View>
          ))}
        </Section>
      )}

      {assigned.length > 0 && (
        <Section title="Areas assigned to you">
          {assigned.map((r) => (
            <View key={r.id} style={s.card}>
              <Text style={s.reqArea}>{r.area}</Text>
              <Text style={s.reqMeta}>{r.bhk !== 'any' ? `${r.bhk} BHK · ` : ''}{r.budgetMax ? `up to ${inr(r.budgetMax)}` : 'any budget'}</Text>
              {r.notes ? <Text style={s.reqNotes}>“{r.notes}”</Text> : null}
              {r.status === 'fulfilled' ? (
                <Text style={s.shared}>Shared {Array.isArray(r.matchedListingIds) ? r.matchedListingIds.length : 0} listing(s).</Text>
              ) : (
                <>
                  <TextInput style={[s.input, { marginTop: 10 }]} value={ids[r.id] ?? ''} onChangeText={(t) => setIds({ ...ids, [r.id]: t })} placeholder="Listing IDs, comma-separated" placeholderTextColor={colors.slate} />
                  <Pressable style={s.btn} onPress={() => fulfill(r.id)}><Text style={s.btnTxt}>Share with renter</Text></Pressable>
                </>
              )}
            </View>
          ))}
        </Section>
      )}

      <Section title={`Your submissions${data.submissions?.length ? ` (${data.submissions.length})` : ''}`}>
        {(!data.submissions || data.submissions.length === 0) ? (
          <View style={s.card}><Text style={s.reqMeta}>No submissions yet.</Text></View>
        ) : data.submissions.map((sub: any) => (
          <View key={sub.id} style={s.subRow}>
            <Text style={s.subT}>{sub.bhk} BHK · {sub.landmark ?? 'Area'}</Text>
            <Text style={[s.subStatus, { color: sub.status === 'verified' ? colors.green : sub.status === 'rejected' ? colors.red : colors.yellow }]}>{sub.status}</Text>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={{ marginTop: 24 }}><Text style={s.secTitle}>{title}</Text>{children}</View>;
}
function WStat({ label, value }: { label: string; value: string }) {
  return <View><Text style={s.wStatL}>{label}</Text><Text style={s.wStatV}>{value}</Text></View>;
}
function Kpi({ label, value }: { label: string; value: string }) {
  return <View style={s.kpi}><Text style={s.kpiV}>{value}</Text><Text style={s.kpiL}>{label}</Text></View>;
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  err: { color: colors.red, padding: 24, textAlign: 'center' },
  wallet: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 20 },
  wLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  wBig: { color: colors.white, fontSize: 40, fontWeight: '800', marginTop: 6, fontFamily: mono },
  wRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  wStatL: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase' },
  wStatV: { color: colors.white, fontSize: 16, fontWeight: '700', fontFamily: mono, marginTop: 4 },
  wBtn: { backgroundColor: colors.white, borderRadius: radius.md, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  wBtnTxt: { color: colors.ink, fontWeight: '700' },
  kpis: { flexDirection: 'row', gap: 10, marginTop: 16 },
  kpi: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  kpiV: { fontSize: 24, fontWeight: '800', color: colors.ink },
  kpiL: { fontSize: 11, color: colors.slate, marginTop: 4 },
  secTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginTop: 10 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, height: 44, paddingHorizontal: 12, fontSize: 14, color: colors.ink, backgroundColor: colors.canvas },
  btn: { backgroundColor: colors.ink, borderRadius: radius.sm, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnTxt: { color: colors.white, fontWeight: '700' },
  notif: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  notifT: { fontSize: 14, fontWeight: '700', color: colors.ink },
  notifB: { fontSize: 12, color: colors.slate, marginTop: 2 },
  reqArea: { fontSize: 15, fontWeight: '700', color: colors.ink },
  reqMeta: { fontSize: 12, color: colors.slate, marginTop: 4 },
  reqNotes: { fontSize: 13, color: colors.ink, marginTop: 6 },
  shared: { fontSize: 12, color: colors.green, marginTop: 8 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  subT: { fontSize: 14, fontWeight: '600', color: colors.ink, flex: 1 },
  subStatus: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }
});
