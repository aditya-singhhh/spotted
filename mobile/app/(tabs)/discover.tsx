import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { colors, radius } from '../../lib/theme';
import ListingCard from '../../components/ListingCard';

export default function Discover() {
  const [all, setAll] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await api<{ listings: any[] }>('/api/listings?limit=60');
      setAll(data.listings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = q.trim()
    ? all.filter((l) => `${l.landmark ?? ''} ${l.bhk} bhk`.toLowerCase().includes(q.trim().toLowerCase()))
    : all;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Explore rentals</Text>
        <View style={s.search}>
          <Ionicons name="search-outline" size={18} color={colors.slate} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search area — HSR, Indiranagar…"
            placeholderTextColor={colors.slate}
            style={s.input}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          renderItem={({ item }) => <ListingCard l={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.ink} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="home-outline" size={32} color={colors.slate} />
              <Text style={s.emptyTxt}>{error || 'No homes match your search yet.'}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, color: colors.ink, fontSize: 15 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTxt: { color: colors.slate, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }
});
