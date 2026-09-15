import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { colors, radius } from '../../lib/theme';

export default function Profile() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  if (loading) return <SafeAreaView style={s.safe} />;

  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <Ionicons name="person-circle-outline" size={56} color={colors.slate} />
          <Text style={s.h2}>Sign in to your account</Text>
          <Text style={s.sub}>Rent, scout, and track your activity — one account.</Text>
          <Pressable style={s.btn} onPress={() => router.push('/login')}>
            <Text style={s.btnTxt}>Sign in / Create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initial = (user.email || 'U').charAt(0).toUpperCase();
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.pad}>
        <View style={s.headerRow}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initial}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.email} numberOfLines={1}>{user.email}</Text>
            <Text style={s.role}>Member</Text>
          </View>
        </View>

        <Text style={s.soon}>Recently viewed, shortlist, unlocked contacts, wallet and your scout requests arrive in the next update.</Text>

        <Pressable style={s.signout} onPress={signOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={s.signoutTxt}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 8 },
  sub: { fontSize: 14, color: colors.slate, textAlign: 'center' },
  pad: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 22, fontWeight: '800', color: colors.accent },
  email: { fontSize: 16, fontWeight: '700', color: colors.ink },
  role: { fontSize: 12, color: colors.slate, marginTop: 2 },
  soon: { fontSize: 14, color: colors.slate, marginTop: 24, lineHeight: 21 },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 48, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  btnTxt: { color: colors.white, fontWeight: '700' },
  signout: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, alignSelf: 'flex-start' },
  signoutTxt: { color: colors.red, fontWeight: '700', fontSize: 15 }
});
