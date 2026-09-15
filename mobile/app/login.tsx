import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { colors, radius } from '../lib/theme';

export default function Login() {
  const router = useRouter();
  const { user } = useAuth();
  const [isNew, setIsNew] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (user) router.back(); }, [user]);

  async function submit() {
    setError('');
    if (!email.trim() || password.length < 6) { setError('Enter a valid email and a 6+ character password.'); return; }
    setBusy(true);
    try {
      if (isNew) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      const code = String(e?.code ?? '');
      setError(
        code.includes('invalid-credential') || code.includes('wrong-password') ? 'Email or password is incorrect.'
        : code.includes('email-already-in-use') ? 'An account already exists — sign in instead.'
        : code.includes('network') ? 'Network error — check your connection.'
        : 'Could not sign in.'
      );
    } finally { setBusy(false); }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>{isNew ? 'Create your account' : 'Welcome back'}</Text>
      <Text style={s.sub}>One account to rent, scout, and track your activity.</Text>

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.slate} />
      <Text style={s.label}>Password</Text>
      <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.slate} />

      {error ? <Text style={s.err}>{error}</Text> : null}

      <Pressable style={s.btn} onPress={submit} disabled={busy}>
        <Text style={s.btnTxt}>{busy ? 'Please wait…' : isNew ? 'Create account' : 'Sign in'}</Text>
      </Pressable>
      <Pressable onPress={() => setIsNew(!isNew)}>
        <Text style={s.toggle}>{isNew ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.paper, padding: 24 },
  h1: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 12 },
  sub: { fontSize: 14, color: colors.slate, marginTop: 8, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, height: 48, paddingHorizontal: 14, fontSize: 15, color: colors.ink, backgroundColor: colors.canvas },
  err: { color: colors.red, fontSize: 13, marginTop: 12 },
  btn: { backgroundColor: colors.ink, borderRadius: radius.md, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  btnTxt: { color: colors.white, fontWeight: '700', fontSize: 15 },
  toggle: { color: colors.accent, fontWeight: '600', textAlign: 'center', marginTop: 16 }
});
