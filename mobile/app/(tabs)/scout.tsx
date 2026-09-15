import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { uploadToCloudinary } from '../../lib/upload';
import { colors, radius } from '../../lib/theme';

type Pick = { uri: string; type: 'image' | 'video'; mimeType?: string };
const AREAS = [
  { label: 'HSR Layout', lat: 12.9116, lng: 77.6387 },
  { label: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { label: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { label: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { label: 'BTM Layout', lat: 12.9166, lng: 77.6101 }
];

export default function Scout() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.pad}>
          <Text style={s.eyebrow}>SCOUT NETWORK</Text>
          <Text style={s.h1}>Earn from boards you spot.</Text>
          <Text style={s.sub}>Snap a TO-LET board, we verify it, and you earn every time a renter unlocks it — up to 50%.</Text>
          <Pressable style={s.btn} onPress={() => router.push('/login')}><Text style={s.btnTxt}>Sign in to start scouting</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }
  return <ScoutForm />;
}

function ScoutForm() {
  const [home, setHome] = useState<Pick[]>([]);
  const [board, setBoard] = useState<Pick[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [areaLabel, setAreaLabel] = useState('');
  const [bhk, setBhk] = useState('');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [landmark, setLandmark] = useState('');
  const [furnishing, setFurnishing] = useState('unfurnished');
  const [bachelor, setBachelor] = useState('unknown');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [contacted, setContacted] = useState<'yes' | 'no'>('no');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function addMedia(set: (fn: (p: Pick[]) => Pick[]) => void, fromCamera: boolean, max: number) {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please allow access to continue.'); return; }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.7, allowsMultipleSelection: !fromCamera };
    const r = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled) return;
    const picks: Pick[] = r.assets.map((a) => ({ uri: a.uri, type: a.type === 'video' ? 'video' : 'image', mimeType: a.mimeType }));
    set((prev) => [...prev, ...picks].slice(0, max));
  }

  async function useMyLocation() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) { Alert.alert('Location needed', 'Allow location, or pick an area below.'); return; }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setAreaLabel('Current location');
  }

  async function submit() {
    if (!coords) return Alert.alert('Location needed', 'Use your location or pick an area.');
    if (!bhk || !rent) return Alert.alert('Missing details', 'Enter the BHK and rent.');
    if (!ownerPhone.trim()) return Alert.alert('Missing contact', 'Enter the owner/contact number from the board.');
    setBusy(true);
    try {
      const mediaUrls = (await Promise.all(home.map((m) => uploadToCloudinary(m.uri, m.mimeType)))).map((u) => u.url);
      const boardMediaUrls = (await Promise.all(board.map((m) => uploadToCloudinary(m.uri, m.mimeType)))).map((u) => u.url);
      await api('/api/scout/submit', {
        method: 'POST',
        body: {
          lat: coords.lat, lng: coords.lng, bhk: Number(bhk), rent: Number(rent), deposit: Number(deposit || 0),
          landmark: landmark || areaLabel, ownerName, ownerPhone, furnishing, bachelorAllowed: bachelor,
          contactedOwner: contacted, availabilityConfirmed: contacted === 'yes',
          mediaUrls, boardMediaUrls
        }
      });
      setDone(true);
    } catch (e) {
      Alert.alert('Submission failed', e instanceof Error ? e.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="checkmark-circle" size={56} color={colors.green} />
          <Text style={s.h2}>Discovery submitted!</Text>
          <Text style={s.sub}>Our team will verify it — usually within a day. You'll earn when renters unlock it.</Text>
          <Pressable style={s.btn} onPress={() => { setDone(false); setHome([]); setBoard([]); setBhk(''); setRent(''); setOwnerPhone(''); }}><Text style={s.btnTxt}>Submit another</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View style={s.rowBetween}>
          <Text style={s.h1}>Submit a discovery</Text>
          <Link href="/scout-dashboard" asChild><Pressable><Text style={s.link}>Dashboard →</Text></Pressable></Link>
        </View>
        <Text style={s.sub}>Takes under two minutes.</Text>

        <MediaRow label="Photos / video of the home" hint="Public — helps renters browse" items={home} onCamera={() => addMedia(setHome, true, 8)} onGallery={() => addMedia(setHome, false, 8)} onRemove={(i) => setHome((p) => p.filter((_, x) => x !== i))} />
        <MediaRow label="TO-LET board photo 🔒" hint="Hidden until a renter unlocks (may show the number)" items={board} onCamera={() => addMedia(setBoard, true, 3)} onGallery={() => addMedia(setBoard, false, 3)} onRemove={(i) => setBoard((p) => p.filter((_, x) => x !== i))} />

        <Label>Location</Label>
        <Pressable style={s.locBtn} onPress={useMyLocation}><Ionicons name="location-outline" size={16} color={colors.accent} /><Text style={s.locTxt}>{coords ? `✓ ${areaLabel || 'Location set'}` : 'Use my current location'}</Text></Pressable>
        <View style={s.chips}>
          {AREAS.map((a) => (
            <Pressable key={a.label} style={[s.chip, areaLabel === a.label && s.chipOn]} onPress={() => { setCoords({ lat: a.lat, lng: a.lng }); setAreaLabel(a.label); }}>
              <Text style={[s.chipTxt, areaLabel === a.label && s.chipTxtOn]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.row2}>
          <View style={s.col}><Label>BHK</Label><TextInput style={s.input} value={bhk} onChangeText={setBhk} keyboardType="number-pad" placeholder="2" placeholderTextColor={colors.slate} /></View>
          <View style={s.col}><Label>Rent ₹/mo</Label><TextInput style={s.input} value={rent} onChangeText={setRent} keyboardType="number-pad" placeholder="25000" placeholderTextColor={colors.slate} /></View>
        </View>
        <View style={s.row2}>
          <View style={s.col}><Label>Deposit ₹</Label><TextInput style={s.input} value={deposit} onChangeText={setDeposit} keyboardType="number-pad" placeholder="100000" placeholderTextColor={colors.slate} /></View>
          <View style={s.col}><Label>Landmark</Label><TextInput style={s.input} value={landmark} onChangeText={setLandmark} placeholder="Near metro" placeholderTextColor={colors.slate} /></View>
        </View>

        <Label>Furnishing</Label>
        <Segmented value={furnishing} onChange={setFurnishing} options={[['unfurnished', 'Unfurnished'], ['semi furnished', 'Semi'], ['fully furnished', 'Full']]} />
        <Label>Who can rent</Label>
        <Segmented value={bachelor} onChange={setBachelor} options={[['yes', 'Bachelors'], ['no', 'Family'], ['unknown', 'Ask owner']]} />

        <Label>Owner name (optional)</Label>
        <TextInput style={s.input} value={ownerName} onChangeText={setOwnerName} placeholder="From the board" placeholderTextColor={colors.slate} />
        <Label>Owner / contact number</Label>
        <TextInput style={s.input} value={ownerPhone} onChangeText={setOwnerPhone} keyboardType="phone-pad" placeholder="From the board" placeholderTextColor={colors.slate} />

        <Label>Have you spoken to the owner?</Label>
        <Segmented value={contacted} onChange={(v) => setContacted(v as 'yes' | 'no')} options={[['yes', 'Yes'], ['no', 'Not yet']]} />

        <Pressable style={[s.btn, { marginTop: 24 }]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnTxt}>Submit discovery</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: React.ReactNode }) { return <Text style={s.label}>{children}</Text>; }

function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <View style={s.seg}>
      {options.map(([v, label]) => (
        <Pressable key={v} style={[s.segItem, value === v && s.segOn]} onPress={() => onChange(v)}>
          <Text style={[s.segTxt, value === v && s.segTxtOn]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MediaRow({ label, hint, items, onCamera, onGallery, onRemove }: { label: string; hint: string; items: Pick[]; onCamera: () => void; onGallery: () => void; onRemove: (i: number) => void }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.hint}>{hint}</Text>
      <View style={s.mediaGrid}>
        {items.map((m, i) => (
          <View key={m.uri} style={s.thumb}>
            <Image source={{ uri: m.uri }} style={StyleSheet.absoluteFill} />
            {m.type === 'video' && <View style={s.vBadge}><Ionicons name="play" size={10} color={colors.white} /></View>}
            <Pressable style={s.remove} onPress={() => onRemove(i)}><Ionicons name="close" size={14} color={colors.white} /></Pressable>
          </View>
        ))}
        <Pressable style={s.addTile} onPress={onCamera}><Ionicons name="camera-outline" size={22} color={colors.slate} /><Text style={s.addTxt}>Camera</Text></Pressable>
        <Pressable style={s.addTile} onPress={onGallery}><Ionicons name="images-outline" size={22} color={colors.slate} /><Text style={s.addTxt}>Gallery</Text></Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  pad: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.slate, letterSpacing: 1 },
  h1: { fontSize: 24, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 8 },
  sub: { fontSize: 14, color: colors.slate, marginTop: 6, lineHeight: 21, textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 12, fontWeight: '700', color: colors.ink, marginTop: 16, marginBottom: 6 },
  hint: { fontSize: 11, color: colors.slate, marginBottom: 8, marginTop: -4 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, height: 46, paddingHorizontal: 12, fontSize: 15, color: colors.ink, backgroundColor: colors.canvas },
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.canvas },
  vBadge: { position: 'absolute', bottom: 3, left: 3, backgroundColor: colors.ink, borderRadius: 8, padding: 2 },
  remove: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  addTile: { width: 72, height: 72, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  addTxt: { fontSize: 9, fontWeight: '700', color: colors.slate, marginTop: 2 },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, height: 46, paddingHorizontal: 12, backgroundColor: colors.canvas },
  locTxt: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipTxt: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  chipTxtOn: { color: colors.white },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.paper },
  segOn: { backgroundColor: colors.ink },
  segTxt: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  segTxtOn: { color: colors.white },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  btnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 }
});
