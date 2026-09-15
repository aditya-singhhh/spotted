import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, mono, inr } from '../lib/theme';

export default function ListingCard({ l }: { l: any }) {
  const router = useRouter();
  const verified = l.status === 'verified';
  return (
    <Pressable style={s.card} onPress={() => router.push(`/listing/${l.id}`)}>
      <View style={s.media}>
        {l.media ? (
          <Image source={{ uri: l.media }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name="home-outline" size={40} color={colors.slate} />
        )}
        <View style={[s.badge, { backgroundColor: verified ? colors.greenSoft : colors.yellowSoft }]}>
          <Text style={[s.badgeTxt, { color: verified ? colors.green : colors.yellow }]}>{verified ? 'Verified' : 'Community'}</Text>
        </View>
      </View>
      <View style={s.body}>
        <View style={s.row}>
          <Text style={s.bhk}>{l.bhk} BHK</Text>
          <Text style={s.rent}>{inr(l.rent)}<Text style={s.mo}>/mo</Text></Text>
        </View>
        <View style={[s.row, { marginTop: 4 }]}>
          <View style={s.loc}>
            <Ionicons name="location-outline" size={13} color={colors.slate} />
            <Text style={s.locTxt} numberOfLines={1}>{l.landmark}</Text>
          </View>
          {typeof l.trustScore === 'number' && (
            <View style={s.trust}><Ionicons name="shield-checkmark-outline" size={12} color={colors.green} /><Text style={s.trustTxt}>{l.trustScore}</Text></View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', marginBottom: 12 },
  media: { height: 160, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  body: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bhk: { fontSize: 16, fontWeight: '700', color: colors.ink },
  rent: { fontSize: 16, fontWeight: '700', color: colors.ink, fontFamily: mono },
  mo: { fontSize: 12, fontWeight: '400', color: colors.slate, fontFamily: mono },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  locTxt: { fontSize: 12, color: colors.slate, flexShrink: 1 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trustTxt: { fontSize: 12, color: colors.green, fontWeight: '600' }
});
