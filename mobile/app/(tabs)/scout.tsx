import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, radius } from '../../lib/theme';

// Phase 3 will add native camera capture + the full submit form. This is the
// scout landing with the pitch + auth-aware CTA.
export default function Scout() {
  const router = useRouter();
  const { user } = useAuth();

  const steps = [
    { icon: 'camera-outline' as const, t: 'Snap the board', b: 'A photo or quick video.' },
    { icon: 'shield-checkmark-outline' as const, t: 'We verify', b: 'Usually within a day.' },
    { icon: 'wallet-outline' as const, t: 'You earn', b: 'Up to 50% of every unlock.' }
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.pad}>
        <Text style={s.eyebrow}>SCOUT NETWORK</Text>
        <Text style={s.h1}>Earn from boards you spot.</Text>
        <Text style={s.sub}>See a TO-LET board on your street? Share it in two minutes and earn every time a renter unlocks it.</Text>

        {steps.map((st) => (
          <View key={st.t} style={s.step}>
            <View style={s.stepIcon}><Ionicons name={st.icon} size={20} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepT}>{st.t}</Text>
              <Text style={s.stepB}>{st.b}</Text>
            </View>
          </View>
        ))}

        <Pressable style={s.btn} onPress={() => (user ? null : router.push('/login'))}>
          <Text style={s.btnTxt}>{user ? 'Submit a discovery (coming soon)' : 'Sign in to start scouting'}</Text>
        </Pressable>
        {user && <Text style={s.note}>Native camera capture + the submit form land in the next update.</Text>}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  pad: { padding: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.slate, letterSpacing: 1 },
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 8 },
  sub: { fontSize: 15, color: colors.slate, marginTop: 10, lineHeight: 22 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  stepIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  stepT: { fontSize: 15, fontWeight: '700', color: colors.ink },
  stepB: { fontSize: 13, color: colors.slate, marginTop: 2 },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  btnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  note: { fontSize: 12, color: colors.slate, textAlign: 'center', marginTop: 10 }
});
